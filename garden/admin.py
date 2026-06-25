from django.contrib import admin

from .models import GardenSlot, Plant


@admin.register(GardenSlot)
class GardenSlotAdmin(admin.ModelAdmin):
    list_display = ('user', 'slot_number', 'is_occupied', 'created_at')
    list_filter = ('is_occupied', 'user')
    ordering = ('user', 'slot_number')


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    list_display = ('user', 'task', 'slot', 'seed_type', 'state', 'planted_at')
    list_filter = ('state', 'seed_type', 'user')
    ordering = ('user', 'slot__slot_number')
