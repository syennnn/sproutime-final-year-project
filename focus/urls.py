from django.urls import path
from . import views

app_name = 'focus'

urlpatterns = [
    path('', views.focus_home, name='focus_home'),
    path('start/', views.start_focus_session, name='start_focus_session'),
    path('pause/', views.pause_focus_session, name='pause_focus_session'),
    path('resume/', views.resume_focus_session, name='resume_focus_session'),
    path('heartbeat/', views.heartbeat_focus_session, name='heartbeat_focus_session'),
    path('status/', views.get_focus_session_status, name='get_focus_session_status'),
    path('water/', views.water_subtask, name='water_subtask'),
    path('end/', views.end_focus_session, name='end_focus_session'),
]
