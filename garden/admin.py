from django.contrib import admin

from .models import GardenSlot


@admin.register(GardenSlot)
class GardenSlotAdmin(admin.ModelAdmin):
    list_display = ('user', 'slot_number', 'is_occupied', 'created_at')
    list_filter = ('is_occupied', 'user')
    ordering = ('user', 'slot_number')
