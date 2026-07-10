import os

from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

from .models import Profile


class RegisterForm(UserCreationForm):
    full_name = forms.CharField(
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Full name (optional)',
        }),
    )
    email = forms.EmailField(
        required=False,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Email address',
        }),
    )

    class Meta:
        model = User
        fields = ['full_name', 'email', 'username', 'password1', 'password2']
        widgets = {
            'username': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Choose a username'}),
            'password1': forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Create a password'}),
            'password2': forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Confirm password'}),
        }

    def save(self, commit=True):
        user = super().save(commit=False)
        email = self.cleaned_data.get('email')
        full_name = self.cleaned_data.get('full_name')
        if email:
            user.email = email
        if full_name:
            parts = full_name.strip().split(' ', 1)
            user.first_name = parts[0]
            if len(parts) > 1:
                user.last_name = parts[1]
        if commit:
            user.save()
        return user


class LoginForm(AuthenticationForm):
    username = forms.CharField(widget=forms.TextInput(attrs={'class': 'form-control', 'autofocus': True, 'placeholder': 'Username or Email'}))
    password = forms.CharField(widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Password'}))

    def clean_username(self):
        username = self.cleaned_data.get('username')
        if username:
            user_model = get_user_model()
            user = user_model.objects.filter(email__iexact=username).first()
            if user:
                return user.username
        return username


class ProfileForm(forms.ModelForm):
    username = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Username'}),
        required=True,
    )
    profile_image = forms.FileField(required=False, widget=forms.FileInput(attrs={'class': 'form-control', 'accept': '.jpg,.jpeg,.png,.webp'}))
    first_name = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'First name'}),
        required=False,
    )
    last_name = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Last name'}),
        required=False,
    )
    email = forms.EmailField(
        required=False,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Email address',
        }),
    )

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email']

    def clean_email(self):
        email = self.cleaned_data.get('email')
        return email or ''

    def clean_profile_image(self):
        image = self.cleaned_data.get('profile_image')
        if not image:
            return image

        allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
        extension = os.path.splitext(image.name)[1].lower()
        content_type = getattr(image, 'content_type', '') or ''
        allowed_types = {'image/jpeg', 'image/png', 'image/webp'}

        if extension not in allowed_extensions:
            raise ValidationError('Please upload a JPG, PNG, or WEBP image.')

        if content_type and content_type not in allowed_types:
            raise ValidationError('Please upload a JPG, PNG, or WEBP image.')

        if image.size > 5 * 1024 * 1024:
            raise ValidationError('Profile image must be smaller than 5 MB.')

        return image

    def save(self, commit=True):
        user = super().save(commit=False)
        if commit:
            user.save()
        profile, _ = Profile.objects.get_or_create(user=user)
        image = self.cleaned_data.get('profile_image')
        if image is not None:
            profile.profile_image = image
            profile.save()
        return user
