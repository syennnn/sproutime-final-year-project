from django.contrib import admin

from .models import SubTask, Task


class SubTaskInline(admin.TabularInline):
    model = SubTask
    extra = 0
    readonly_fields = ('created_at',)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'seed_type', 'status', 'estimated_duration', 'created_at')
    list_filter = ('status', 'seed_type', 'created_at')
    search_fields = ('title', 'description', 'user__username')
    inlines = [SubTaskInline]


@admin.register(SubTask)
class SubTaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'task', 'is_completed', 'is_watered', 'created_at')
    list_filter = ('is_completed', 'is_watered', 'created_at')
    search_fields = ('title', 'task__title')
