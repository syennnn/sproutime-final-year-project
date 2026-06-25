from django.contrib import admin

from .models import FocusSession


@admin.register(FocusSession)
class FocusSessionAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'task',
        'plant',
        'target_duration_minutes',
        'elapsed_seconds',
        'is_running',
        'is_completed',
        'last_heartbeat_at',
        'created_at',
    )
    list_filter = ('is_running', 'is_completed', 'user')
    ordering = ('-created_at',)
