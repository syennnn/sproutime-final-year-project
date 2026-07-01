from django.contrib import admin
from django.urls import path, include
from django.views.generic import TemplateView
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(template_name='home.html'), name='home'),
    path('dashboard/', include('dashboard.urls')),
    path('accounts/', include('accounts.urls')),
    path('tasks/', include('tasks.urls')),
    path('garden/', include('garden.urls')),
    path('focus/', include('focus.urls')),
    path("credits/", TemplateView.as_view(template_name="credits.html"), name="credits"),
]
