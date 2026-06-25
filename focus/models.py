from django.conf import settings
from django.db import models

from garden.models import Plant
from tasks.models import Task


class FocusSession(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='focus_sessions',
    )
    task = models.OneToOneField(
        Task,
        on_delete=models.CASCADE,
        related_name='focus_session',
    )
    plant = models.OneToOneField(
        Plant,
        on_delete=models.CASCADE,
        related_name='focus_session',
    )
    target_duration_minutes = models.PositiveIntegerField()
    elapsed_seconds = models.PositiveIntegerField(default=0)
    started_at = models.DateTimeField(null=True, blank=True)
    paused_at = models.DateTimeField(null=True, blank=True)
    last_started_at = models.DateTimeField(null=True, blank=True)
    last_heartbeat_at = models.DateTimeField(null=True, blank=True)
    is_running = models.BooleanField(default=False)
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.task.title} focus session'
