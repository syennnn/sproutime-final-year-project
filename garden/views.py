from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import transaction
from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.views.decorators.http import require_POST

from .models import GardenSlot, Plant
from tasks.models import Task


@login_required
def garden_home(request):
    for slot_number in range(1, 21):
        GardenSlot.objects.get_or_create(
            user=request.user,
            slot_number=slot_number,
        )

    slots = GardenSlot.objects.filter(user=request.user).order_by('slot_number')
    plants = list(Plant.objects.filter(
        user=request.user,
        slot__isnull=False,
    ).select_related(
        'task',
        'slot',
        'focus_session',
    ).prefetch_related('task__subtasks'))
    plants_by_slot = {plant.slot_id: plant for plant in plants}
    garden_slots = [
        {
            'slot': slot,
            'plant': plants_by_slot.get(slot.id),
        }
        for slot in slots
    ]
    stored_seeds = Task.objects.filter(
        user=request.user,
        status=Task.STATUS_STORED,
    ).annotate(
        water_count=Count('subtasks'),
    ).order_by('-created_at')
    active_plant = (
        next((plant for plant in plants if plant.state == Plant.STATE_GROWING), None)
        or next((plant for plant in plants if plant.state == Plant.STATE_SEED), None)
    )
    active_plant_name = active_plant.get_seed_type_display() if active_plant else 'None'

    return render(request, 'garden/garden.html', {
        'garden_slots': garden_slots,
        'stored_seeds': stored_seeds,
        'username': request.user.username,
        'stored_seeds_count': stored_seeds.count(),
        'flowers_count': sum(1 for plant in plants if plant.state == Plant.STATE_FLOWER),
        'buds_count': sum(1 for plant in plants if plant.state == Plant.STATE_BUD),
        'active_plant_name': active_plant_name,
        'active_plant_seed_type': active_plant.seed_type if active_plant else '',
        'active_plant_flower_image_path': active_plant.flower_image_path if active_plant else '',
    })


@login_required
def plant_seed(request):
    if request.method != 'POST':
        messages.error(request, 'Choose an empty garden slot and seed before planting.')
        return redirect('garden:garden_home')

    slot_id = request.POST.get('slot_id')
    task_id = request.POST.get('task_id')

    if not slot_id or not task_id:
        messages.error(request, 'Choose an empty garden slot and seed before planting.')
        return redirect('garden:garden_home')

    try:
        slot_id = int(slot_id)
        task_id = int(task_id)
    except (TypeError, ValueError):
        messages.error(request, 'Choose an empty garden slot and seed before planting.')
        return redirect('garden:garden_home')

    with transaction.atomic():
        slot = GardenSlot.objects.select_for_update().filter(
            id=slot_id,
            user=request.user,
        ).first()
        if slot is None:
            messages.error(request, 'That garden slot is not available.')
            return redirect('garden:garden_home')

        task = Task.objects.select_for_update().filter(
            id=task_id,
            user=request.user,
        ).first()
        if task is None:
            messages.error(request, 'That seed is not available.')
            return redirect('garden:garden_home')

        if task.status != Task.STATUS_STORED:
            messages.error(request, 'That seed is no longer in storage.')
            return redirect('garden:garden_home')

        if slot.is_occupied:
            messages.error(request, 'That garden slot is already occupied.')
            return redirect('garden:garden_home')

        if Plant.objects.filter(task=task).exists():
            messages.error(request, 'That seed has already been planted.')
            return redirect('garden:garden_home')

        if Plant.objects.filter(slot=slot).exists():
            messages.error(request, 'That garden slot already has a plant.')
            return redirect('garden:garden_home')

        has_active_task = Task.objects.filter(
            user=request.user,
            status__in=[Task.STATUS_PLANTED, Task.STATUS_IN_PROGRESS],
        ).exists()
        if has_active_task:
            messages.error(
                request,
                'You already have an active planted seed. Finish or clear it before planting another.',
            )
            return redirect('garden:garden_home')

        Plant.objects.create(
            user=request.user,
            task=task,
            slot=slot,
            seed_type=task.seed_type,
            state=Plant.STATE_SEED,
        )
        slot.is_occupied = True
        slot.save(update_fields=['is_occupied', 'updated_at'])
        task.status = Task.STATUS_PLANTED
        task.save(update_fields=['status', 'updated_at'])

    messages.success(request, 'Your seed has been planted!')
    return redirect('garden:garden_home')


@login_required
@require_POST
def clear_garden_slot(request):
    plant_id = request.POST.get('plant_id')
    if not plant_id:
        return JsonResponse({
            'success': False,
            'message': 'Choose a saved result before deleting it from the garden.',
        }, status=400)

    with transaction.atomic():
        plant = Plant.objects.select_for_update().select_related('slot').filter(
            id=plant_id,
            user=request.user,
        ).first()
        if plant is None:
            return JsonResponse({
                'success': False,
                'message': 'That saved result is not available.',
            }, status=404)

        if plant.state not in [Plant.STATE_FLOWER, Plant.STATE_BUD]:
            return JsonResponse({
                'success': False,
                'message': 'Only finished flower or bud results can be deleted from the garden.',
            }, status=400)

        slot_id = plant.slot_id
        slot_number = plant.slot.slot_number if plant.slot else None
        if plant.slot_id:
            slot = GardenSlot.objects.select_for_update().filter(
                id=plant.slot_id,
                user=request.user,
            ).first()
            plant.slot = None
            plant.save(update_fields=['slot'])

            if slot:
                slot.is_occupied = False
                slot.save(update_fields=['is_occupied', 'updated_at'])

    visible_results = Plant.objects.filter(
        user=request.user,
        slot__isnull=False,
    )

    return JsonResponse({
        'success': True,
        'message': 'Deleted from the garden slot. The result is still saved on your dashboard.',
        'plant_id': plant.id,
        'slot_id': slot_id,
        'slot_number': slot_number,
        'flowers_count': visible_results.filter(state=Plant.STATE_FLOWER).count(),
        'buds_count': visible_results.filter(state=Plant.STATE_BUD).count(),
    })
