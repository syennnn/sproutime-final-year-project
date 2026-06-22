from django.urls import path
from . import views

app_name = 'focus'

urlpatterns = [
    path('', views.focus_home, name='focus_home'),
]
