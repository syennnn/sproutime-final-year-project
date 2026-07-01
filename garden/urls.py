from django.urls import path
from . import views

app_name = 'garden'

urlpatterns = [
    path('', views.garden_home, name='garden_home'),
    path('plant-seed/', views.plant_seed, name='plant_seed'),
    path('clear-slot/', views.clear_garden_slot, name='clear_garden_slot'),
]
