from django.contrib.auth.models import User
from django.db import models


class Task(models.Model):
    SEED_TYPES = [
        ('rose', 'Rose'),
        ('sunflower', 'Sunflower'),
        ('tulip', 'Tulip'),
        ('white_daisy', 'White Daisy'),
        ('pink_peony', 'Pink_Peony'),
        ('blue_peony', 'Blue_Peony'),
        ('lavender', 'Lavender'),
        ('lily', 'Lily'),
        ('spider_lily', 'Spider_Lily'),
        ('prurple_daisy', 'Purple Daisy'),
        ('hibiscus', 'Hibiscus'),
        ('hydrangea', 'Hydrangea'),
        ('bluebell', 'Bluebell'),
        ('lotus', 'Lotus'),
        ('marigold', 'Marigold'),
        ('poppy', 'Poppy'),
        ('cactus', 'Cactus'),
        ('aloe', 'Aloe'),
        ('strawberry', 'Strawberry'),
        ('mint', 'Mint'),
        ('basil', 'Basil'),
        ('herb', 'Herb'),
    ]

    STATUS_STORED = 'stored'
    STATUS_PLANTED = 'planted'
    STATUS_IN_PROGRESS = 'in_progress'
    STATUS_COMPLETED = 'completed'
    STATUS_PARTIAL = 'partial'

    STATUS_CHOICES = [
        (STATUS_STORED, 'Stored'),
        (STATUS_PLANTED, 'Planted'),
        (STATUS_IN_PROGRESS, 'In Progress'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_PARTIAL, 'Partial'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=180)
    description = models.TextField()
    estimated_duration = models.PositiveIntegerField()
    seed_type = models.CharField(max_length=32, choices=SEED_TYPES)
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default=STATUS_STORED)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.seed_type})"

    @classmethod
    def random_seed_type(cls):
        import random

        return random.choice([choice[0] for choice in cls.SEED_TYPES])


class SubTask(models.Model):
    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='subtasks')
    title = models.CharField(max_length=180)
    is_completed = models.BooleanField(default=False)
    is_watered = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
