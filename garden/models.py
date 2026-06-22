from django.conf import settings
from django.db import models


class GardenSlot(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='garden_slots'
    )
    slot_number = models.PositiveIntegerField()
    is_occupied = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'slot_number')
        ordering = ['slot_number']

    def __str__(self):
        return f'{self.user.username} slot {self.slot_number}'
