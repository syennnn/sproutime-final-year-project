from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from .models import GardenSlot
from tasks.models import Task


@login_required
def garden_home(request):
    for slot_number in range(1, 21):
        GardenSlot.objects.get_or_create(
            user=request.user,
            slot_number=slot_number,
        )

    slots = GardenSlot.objects.filter(user=request.user).order_by('slot_number')
    stored_seeds = Task.objects.filter(
        user=request.user,
        status=Task.STATUS_STORED,
    ).order_by('-created_at')

    return render(request, 'garden/garden.html', {
        'slots': slots,
        'stored_seeds': stored_seeds,
    })
