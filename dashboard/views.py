from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from django.templatetags.static import static
from django.utils import timezone

from focus.models import FocusSession
from garden.models import Plant
from tasks.models import Task


RESULT_IMAGE_FALLBACK = 'images/game/icons/icon_register_flower.png'


def _format_duration(total_seconds):
    total_seconds = max(0, int(total_seconds or 0))
    hours = total_seconds // 3600
    minutes = (total_seconds % 3600) // 60
    seconds = total_seconds % 60

    if hours:
        return f'{hours}:{minutes:02d}:{seconds:02d}'
    return f'{minutes:02d}:{seconds:02d}'


def _current_elapsed_seconds(session):
    elapsed = session.elapsed_seconds
    if session.is_running and session.last_started_at:
        elapsed += max(0, int((timezone.now() - session.last_started_at).total_seconds()))
    return elapsed


def _watering_progress(task):
    subtasks = list(task.subtasks.all())
    total = len(subtasks)
    watered = sum(1 for subtask in subtasks if subtask.is_watered)
    percent = round((watered / total) * 100) if total else 0
    return watered, total, percent


def _plant_state_label(state):
    return dict(Plant.STATE_CHOICES).get(state, state.title())


def _static_asset_exists(asset_path):
    return (settings.BASE_DIR / 'static' / asset_path).exists()


def _result_image_path(plant):
    if plant.state == Plant.STATE_FLOWER:
        asset_path = plant.get_flower_image_path()
    else:
        asset_path = plant.get_bud_image_path()

    if _static_asset_exists(asset_path):
        return asset_path
    return RESULT_IMAGE_FALLBACK


def _build_active_session(session):
    if session is None:
        return None

    elapsed_seconds = _current_elapsed_seconds(session)
    target_seconds = session.target_duration_minutes * 60
    remaining_seconds = max(0, target_seconds - elapsed_seconds)
    watered, total, percent = _watering_progress(session.task)

    return {
        'id': session.id,
        'plant_id': session.plant_id,
        'task_title': session.task.title,
        'seed_type': session.task.get_seed_type_display(),
        'plant_state': session.plant.state,
        'plant_state_label': _plant_state_label(session.plant.state),
        'is_running': session.is_running,
        'status_label': 'Running' if session.is_running else 'Paused',
        'elapsed_display': _format_duration(elapsed_seconds),
        'remaining_display': _format_duration(remaining_seconds),
        'watered_count': watered,
        'total_subtasks': total,
        'progress_percent': percent,
    }


def _build_recent_result(plant):
    watered, total, percent = _watering_progress(plant.task)
    focus_session = getattr(plant, 'focus_session', None)
    elapsed_seconds = focus_session.elapsed_seconds if focus_session else 0
    target_seconds = (
        focus_session.target_duration_minutes * 60
        if focus_session
        else plant.task.estimated_duration * 60
    )
    focus_completed = focus_session.is_completed if focus_session else False
    is_flower = plant.state == Plant.STATE_FLOWER
    image_path = _result_image_path(plant)

    return {
        'plant_id': plant.id,
        'task_title': plant.task.title,
        'seed_slug': plant.seed_type,
        'seed_type': plant.get_seed_type_display(),
        'seed_display_name': plant.get_seed_type_display(),
        'plant_state': plant.state,
        'result_type': plant.state,
        'plant_state_label': _plant_state_label(plant.state),
        'watered_count': watered,
        'total_subtasks': total,
        'progress_percent': percent,
        'focus_completed_display': 'Yes' if focus_completed else 'No',
        'focus_target_display': _format_duration(target_seconds),
        'time_spent_display': _format_duration(elapsed_seconds),
        'result_image_url': static(image_path),
        'result_image_path': image_path,
        'result_title': 'Flower Result' if is_flower else 'Bud Result',
        'result_heading': (
            'Your plant has bloomed!'
            if is_flower
            else 'Your plant became a bud.'
        ),
        'result_subtext': (
            'Great focus work - your seed grew into a flower.'
            if is_flower
            else 'You still made progress. This bud shows the effort you started.'
        ),
        'result_message': (
            'You completed both your focus time and all watering steps. This flower will stay in your garden as proof of your progress.'
            if is_flower
            else 'This bud represents partial progress, not failure. You can grow more flowers in your next focus session.'
        ),
    }


@login_required
def dashboard_home(request):
    active_focus_session = (
        FocusSession.objects.filter(
            user=request.user,
            is_completed=False,
        )
        .select_related('task', 'plant')
        .prefetch_related('task__subtasks')
        .order_by('-updated_at', '-created_at')
        .first()
    )

    recent_plants = (
        Plant.objects.filter(
            user=request.user,
            state__in=[Plant.STATE_FLOWER, Plant.STATE_BUD],
        )
        .select_related('task', 'focus_session')
        .prefetch_related('task__subtasks')
        .order_by('-updated_at')
    )

    stats = {
        'seeds': Task.objects.filter(
            user=request.user,
            status__in=[Task.STATUS_STORED, Task.STATUS_PLANTED],
        ).count(),
        'active': Task.objects.filter(
            user=request.user,
            status__in=[Task.STATUS_PLANTED, Task.STATUS_IN_PROGRESS],
        ).count(),
        'flowers': Plant.objects.filter(
            user=request.user,
            state=Plant.STATE_FLOWER,
        ).count(),
        'buds': Plant.objects.filter(
            user=request.user,
            state=Plant.STATE_BUD,
        ).count(),
    }

    context = {
        'active_session': _build_active_session(active_focus_session),
        'stats': stats,
        'recent_results': [_build_recent_result(plant) for plant in recent_plants],
    }
    return render(request, 'dashboard.html', context)


dashboard = dashboard_home
