from django.urls import path
from . import views

app_name = 'tasks'

urlpatterns = [
    path('', views.tasks_home, name='tasks_home'),
    path('create/', views.create_task, name='create_task'),
    path('suggest-subtasks/', views.suggest_subtasks, name='suggest_subtasks'),
]
