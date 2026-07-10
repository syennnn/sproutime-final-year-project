from django.contrib.auth import views as auth_views
from django.urls import path

from .forms import LoginForm
from . import views


class CustomLoginView(auth_views.LoginView):
    template_name = 'accounts/login.html'
    authentication_form = LoginForm

    def form_valid(self, form):
        response = super().form_valid(form)
        remember_me = self.request.POST.get('remember_me') == 'on'
        if remember_me:
            self.request.session.set_expiry(60 * 60 * 24 * 14)
        else:
            self.request.session.set_expiry(0)
        return response

app_name = 'accounts'

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', CustomLoginView.as_view(), name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile, name='profile'),
    path('profile/image/update/', views.profile_image_update, name='profile_image_update'),
    path('profile/image/delete/', views.profile_image_delete, name='profile_image_delete'),
]
