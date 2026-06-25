from django.conf import settings
from django.db import models

from tasks.models import Task


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


class Plant(models.Model):
    STATE_SEED = 'seed'
    STATE_GROWING = 'growing'
    STATE_FLOWER = 'flower'
    STATE_BUD = 'bud'

    STATE_CHOICES = [
        (STATE_SEED, 'Seed'),
        (STATE_GROWING, 'Growing'),
        (STATE_FLOWER, 'Flower'),
        (STATE_BUD, 'Bud'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='plants',
    )
    task = models.OneToOneField(
        Task,
        on_delete=models.CASCADE,
        related_name='plant',
    )
    slot = models.OneToOneField(
        GardenSlot,
        on_delete=models.CASCADE,
        related_name='plant',
    )
    seed_type = models.CharField(max_length=32, choices=Task.SEED_TYPES)
    state = models.CharField(
        max_length=16,
        choices=STATE_CHOICES,
        default=STATE_SEED,
    )
    planted_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['slot__slot_number']

    def __str__(self):
        return f'{self.task.title} in slot {self.slot.slot_number}'
