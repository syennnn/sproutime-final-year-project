import os

from django.contrib import messages
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.shortcuts import redirect, render

from .forms import ProfileForm, RegisterForm
from .models import Profile


def register(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            return redirect('garden:garden_home')
    else:
        form = RegisterForm()

    return render(request, 'accounts/register.html', {
        'form': form,
    })


def logout_view(request):
    logout(request)
    return redirect('/')


@login_required
def profile(request):
    if request.method == 'POST':
        if 'delete_account' in request.POST:
            user = request.user
            user.delete()
            logout(request)
            messages.success(request, 'Your account has been deleted.')
            return redirect('home')

        form = ProfileForm(request.POST or None, request.FILES or None, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your profile has been updated.')
            return redirect('accounts:profile')
    else:
        form = ProfileForm(instance=request.user)

    profile = Profile.objects.get_or_create(user=request.user)[0]

    return render(request, 'accounts/profile.html', {
        'form': form,
        'profile': profile,
    })


@login_required
def profile_image_update(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

    profile = Profile.objects.get_or_create(user=request.user)[0]
    image_file = request.FILES.get('profile_image')

    if not image_file:
        return JsonResponse({'error': 'Please select an image.'}, status=400)

    allowed_extensions = {'.jpg', '.jpeg', '.png', '.webp'}
    extension = os.path.splitext(image_file.name)[1].lower()
    content_type = getattr(image_file, 'content_type', '') or ''
    allowed_types = {'image/jpeg', 'image/png', 'image/webp'}

    if extension not in allowed_extensions:
        return JsonResponse({'error': 'Please upload a JPG, PNG, or WEBP image.'}, status=400)

    if content_type and content_type not in allowed_types:
        return JsonResponse({'error': 'Please upload a JPG, PNG, or WEBP image.'}, status=400)

    if image_file.size > 5 * 1024 * 1024:
        return JsonResponse({'error': 'Profile image must be smaller than 5 MB.'}, status=400)

    try:
        old_image = profile.profile_image
        profile.profile_image = image_file
        profile.save()
    except ValidationError as exc:
        return JsonResponse({'error': str(exc)}, status=400)

    if old_image and old_image.name and old_image != profile.profile_image:
        old_image.delete(save=False)

    return JsonResponse({'success': True, 'image_url': profile.profile_image.url})


@login_required
def profile_image_delete(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Only POST requests are allowed.'}, status=405)

    profile = Profile.objects.get_or_create(user=request.user)[0]
    if profile.profile_image:
        old_image = profile.profile_image
        profile.profile_image = None
        profile.save()
        old_image.delete(save=False)

    return JsonResponse({'success': True, 'fallback': True})
