from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone
from django.views.decorators.http import require_POST

from garden.models import Plant
from tasks.models import SubTask, Task

from .models import FocusSession


HEARTBEAT_STALE_SECONDS = 30


def focus_home(request):
    return render(request, 'focus/placeholder.html')


def _current_elapsed_seconds(session, now=None):
    now = now or timezone.now()
    elapsed = session.elapsed_seconds
    if session.is_running and session.last_started_at:
        elapsed += max(0, int((now - session.last_started_at).total_seconds()))
    return elapsed


def _session_payload(session):
    elapsed_seconds = _current_elapsed_seconds(session)
    target_duration_seconds = session.target_duration_minutes * 60
    remaining_seconds = max(0, target_duration_seconds - elapsed_seconds)
    subtasks = list(session.task.subtasks.order_by('created_at', 'id'))
    watered_count = sum(1 for subtask in subtasks if subtask.is_watered)
    total_subtasks = len(subtasks)
    result = session.plant.state if session.plant.state in [Plant.STATE_FLOWER, Plant.STATE_BUD] else None

    return {
        'success': True,
        'session_id': session.id,
        'plant_id': session.plant_id,
        'task_title': session.task.title,
        'seed_type': session.task.get_seed_type_display(),
        'plant_state': session.plant.state,
        'target_duration_minutes': session.target_duration_minutes,
        'target_duration_seconds': target_duration_seconds,
        'elapsed_seconds': elapsed_seconds,
        'remaining_seconds': remaining_seconds,
        'is_running': session.is_running,
        'is_completed': session.is_completed,
        'has_started': session.started_at is not None,
        'result': result,
        'watered_count': watered_count,
        'total_subtasks': total_subtasks,
        'all_watered': total_subtasks > 0 and watered_count == total_subtasks,
        'subtasks': [
            {
                'id': subtask.id,
                'title': subtask.title,
                'is_completed': subtask.is_completed,
                'is_watered': subtask.is_watered,
            }
            for subtask in subtasks
        ],
    }


def _json_error(message, status=400):
    return JsonResponse({'success': False, 'message': message}, status=status)


def _pause_running_session(session, paused_at=None):
    if not session.is_running:
        return False

    paused_at = paused_at or timezone.now()
    session.elapsed_seconds = _current_elapsed_seconds(session, now=paused_at)
    session.is_running = False
    session.paused_at = paused_at
    session.last_started_at = None
    session.last_heartbeat_at = paused_at
    session.save(update_fields=[
        'elapsed_seconds',
        'is_running',
        'paused_at',
        'last_started_at',
        'last_heartbeat_at',
        'updated_at',
    ])
    return True


def _pause_if_heartbeat_stale(session, now=None):
    if not session.is_running or session.is_completed:
        return False

    now = now or timezone.now()
    heartbeat_at = session.last_heartbeat_at or session.last_started_at
    if heartbeat_at is None:
        return False

    if (now - heartbeat_at).total_seconds() <= HEARTBEAT_STALE_SECONDS:
        return False

    _pause_running_session(session, paused_at=heartbeat_at)
    return True


def _result_for_watered_steps(all_watered):
    if all_watered:
        return Plant.STATE_FLOWER, Task.STATUS_COMPLETED
    return Plant.STATE_BUD, Task.STATUS_PARTIAL


def _finalize_completed_session_result(session):
    payload = _session_payload(session)
    if not session.is_completed or payload['result']:
        return payload

    result_state, task_status = _result_for_watered_steps(payload['all_watered'])

    if session.plant.state != result_state:
        session.plant.state = result_state
        session.plant.save(update_fields=['state', 'updated_at'])

    if session.task.status != task_status:
        session.task.status = task_status
        session.task.save(update_fields=['status', 'updated_at'])

    return _session_payload(session)


@login_required
@require_POST
def start_focus_session(request):
    plant_id = request.POST.get('plant_id')
    if not plant_id:
        return _json_error('Choose a planted seed before starting focus.')

    with transaction.atomic():
        plant = Plant.objects.select_for_update().select_related('task').filter(
            id=plant_id,
            user=request.user,
        ).first()
        if plant is None:
            return _json_error('That planted seed is not available.', status=404)

        if plant.task.user_id != request.user.id:
            return _json_error('That task is not available.', status=404)

        if plant.state not in [Plant.STATE_SEED, Plant.STATE_GROWING]:
            return _json_error('This plant is not ready for a focus session.')

        session, created = FocusSession.objects.select_for_update().get_or_create(
            plant=plant,
            defaults={
                'user': request.user,
                'task': plant.task,
                'target_duration_minutes': plant.task.estimated_duration,
            },
        )

        if session.user_id != request.user.id:
            return _json_error('That focus session is not available.', status=404)

        now = timezone.now()
        _pause_if_heartbeat_stale(session, now=now)
        if session.started_at is None:
            session.started_at = now
        session.last_started_at = now
        session.last_heartbeat_at = now
        session.paused_at = None
        session.is_running = True
        session.is_completed = False
        if created:
            session.task = plant.task
            session.target_duration_minutes = plant.task.estimated_duration
        session.save()

        plant_changed = plant.state == Plant.STATE_SEED
        if plant_changed:
            plant.state = Plant.STATE_GROWING
            plant.save(update_fields=['state', 'updated_at'])

        if plant.task.status != Task.STATUS_IN_PROGRESS:
            plant.task.status = Task.STATUS_IN_PROGRESS
            plant.task.save(update_fields=['status', 'updated_at'])

    return JsonResponse(_session_payload(session))


@login_required
@require_POST
def pause_focus_session(request):
    session_id = request.POST.get('session_id')
    if not session_id:
        return _json_error('No focus session was selected.')

    with transaction.atomic():
        session = FocusSession.objects.select_for_update().select_related('task', 'plant').filter(
            id=session_id,
            user=request.user,
        ).first()
        if session is None:
            return _json_error('That focus session is not available.', status=404)

        if session.is_running:
            _pause_if_heartbeat_stale(session)
            if session.is_running:
                _pause_running_session(session)

    return JsonResponse(_session_payload(session))


@login_required
@require_POST
def resume_focus_session(request):
    session_id = request.POST.get('session_id')
    if not session_id:
        return _json_error('No focus session was selected.')

    with transaction.atomic():
        session = FocusSession.objects.select_for_update().select_related('task', 'plant').filter(
            id=session_id,
            user=request.user,
        ).first()
        if session is None:
            return _json_error('That focus session is not available.', status=404)

        _pause_if_heartbeat_stale(session)
        if session.is_completed:
            return _json_error('This focus session has already ended.')

        now = timezone.now()
        session.is_running = True
        session.last_started_at = now
        session.last_heartbeat_at = now
        session.paused_at = None
        session.save(update_fields=['is_running', 'last_started_at', 'last_heartbeat_at', 'paused_at', 'updated_at'])

    return JsonResponse(_session_payload(session))


@login_required
@require_POST
def heartbeat_focus_session(request):
    session_id = request.POST.get('session_id')
    if not session_id:
        return _json_error('No focus session was selected.')

    action = request.POST.get('action', 'heartbeat')

    with transaction.atomic():
        session = FocusSession.objects.select_for_update().select_related('task', 'plant').filter(
            id=session_id,
            user=request.user,
        ).first()
        if session is None:
            return _json_error('That focus session is not available.', status=404)

        if action == 'pause':
            _pause_running_session(session)
            payload = _session_payload(session)
            payload['message'] = 'Focus session paused because the page was closed.'
            return JsonResponse(payload)

        was_paused_by_heartbeat = _pause_if_heartbeat_stale(session)
        if not was_paused_by_heartbeat and session.is_running and not session.is_completed:
            session.last_heartbeat_at = timezone.now()
            session.save(update_fields=['last_heartbeat_at', 'updated_at'])

        payload = _session_payload(session)
        if was_paused_by_heartbeat:
            payload['message'] = 'Focus session paused because the connection was lost.'

    return JsonResponse(payload)


@login_required
@require_POST
def get_focus_session_status(request):
    plant_id = request.POST.get('plant_id')
    session_id = request.POST.get('session_id')

    session = None
    if session_id:
        session = FocusSession.objects.select_related('task', 'plant').filter(
            id=session_id,
            user=request.user,
        ).first()
    elif plant_id:
        session = FocusSession.objects.select_related('task', 'plant').filter(
            plant_id=plant_id,
            user=request.user,
        ).first()

    if session:
        with transaction.atomic():
            session = FocusSession.objects.select_for_update().select_related('task', 'plant').get(
                id=session.id,
                user=request.user,
            )
            was_paused_by_heartbeat = _pause_if_heartbeat_stale(session)
            payload = _finalize_completed_session_result(session)
        if was_paused_by_heartbeat:
            payload['message'] = 'Focus session paused because the connection was lost.'
        return JsonResponse(payload)

    if not plant_id:
        return _json_error('Choose a planted seed before opening focus.')

    plant = Plant.objects.select_related('task').filter(
        id=plant_id,
        user=request.user,
    ).first()
    if plant is None:
        return _json_error('That planted seed is not available.', status=404)

    subtasks = list(plant.task.subtasks.order_by('created_at', 'id'))
    watered_count = sum(1 for subtask in subtasks if subtask.is_watered)
    total_subtasks = len(subtasks)
    target_duration_seconds = plant.task.estimated_duration * 60

    return JsonResponse({
        'success': True,
        'session_id': None,
        'plant_id': plant.id,
        'task_title': plant.task.title,
        'seed_type': plant.task.get_seed_type_display(),
        'plant_state': plant.state,
        'target_duration_minutes': plant.task.estimated_duration,
        'target_duration_seconds': target_duration_seconds,
        'elapsed_seconds': 0,
        'remaining_seconds': target_duration_seconds,
        'is_running': False,
        'is_completed': False,
        'has_started': False,
        'watered_count': watered_count,
        'total_subtasks': total_subtasks,
        'all_watered': total_subtasks > 0 and watered_count == total_subtasks,
        'subtasks': [
            {
                'id': subtask.id,
                'title': subtask.title,
                'is_completed': subtask.is_completed,
                'is_watered': subtask.is_watered,
            }
            for subtask in subtasks
        ],
    })


@login_required
@require_POST
def water_subtask(request):
    subtask_id = request.POST.get('subtask_id')
    if not subtask_id:
        return _json_error('Choose a watering step first.')

    subtask = SubTask.objects.select_related('task').filter(
        id=subtask_id,
        task__user=request.user,
        task__status__in=[Task.STATUS_PLANTED, Task.STATUS_IN_PROGRESS],
    ).first()
    if subtask is None:
        return _json_error('That watering step is not available.', status=404)

    session = FocusSession.objects.select_related('task', 'plant').filter(
        task=subtask.task,
        user=request.user,
        is_completed=False,
    ).first()
    if session is None or session.started_at is None:
        return _json_error('Start the focus session before watering.')

    if subtask.is_watered:
        payload = _session_payload(session)
        payload['message'] = 'This watering step is already watered.'
        return JsonResponse(payload)

    subtask.is_completed = True
    subtask.is_watered = True
    subtask.save(update_fields=['is_completed', 'is_watered'])

    payload = _session_payload(session)
    payload['message'] = 'Watering step completed.'
    return JsonResponse(payload)


@login_required
@require_POST
def end_focus_session(request):
    session_id = request.POST.get('session_id')
    if not session_id:
        return _json_error('No focus session was selected.')

    with transaction.atomic():
        session = FocusSession.objects.select_for_update().select_related('task', 'plant').filter(
            id=session_id,
            user=request.user,
        ).first()
        if session is None:
            return _json_error('That focus session is not available.', status=404)

        _pause_if_heartbeat_stale(session)
        payload = _session_payload(session)
        all_watered = payload['all_watered']

        session.elapsed_seconds = _current_elapsed_seconds(session)
        result_state, task_status = _result_for_watered_steps(all_watered)

        session.is_running = False
        session.is_completed = True
        session.paused_at = timezone.now()
        session.last_started_at = None
        session.save(update_fields=[
            'elapsed_seconds',
            'is_running',
            'is_completed',
            'paused_at',
            'last_started_at',
            'updated_at',
        ])

        if session.plant.state != result_state:
            session.plant.state = result_state
            session.plant.save(update_fields=['state', 'updated_at'])

        if session.task.status != task_status:
            session.task.status = task_status
            session.task.save(update_fields=['status', 'updated_at'])

    payload = _session_payload(session)
    if payload['result'] == Plant.STATE_FLOWER:
        payload['message'] = 'Your plant has bloomed!'
    else:
        payload['message'] = 'Your plant became a bud.'
    return JsonResponse(payload)
