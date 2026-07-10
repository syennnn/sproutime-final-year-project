from io import BytesIO

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.urls import reverse
from PIL import Image


class RememberMeLoginTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='sprout',
            password='secret123',
        )
        self.login_url = reverse('accounts:login')
        self.redirect_url = reverse('garden:garden_home')

    def test_login_with_remember_me_sets_persistent_session(self):
        response = self.client.post(self.login_url, {
            'username': 'sprout',
            'password': 'secret123',
            'remember_me': 'on',
        })

        self.assertRedirects(response, self.redirect_url)
        self.assertIn('_auth_user_id', self.client.session)
        self.assertFalse(self.client.session.get_expire_at_browser_close())
        self.assertAlmostEqual(
            self.client.session.get_expiry_age(),
            60 * 60 * 24 * 14,
            delta=10,
        )

    def test_login_without_remember_me_expires_on_browser_close(self):
        response = self.client.post(self.login_url, {
            'username': 'sprout',
            'password': 'secret123',
        })

        self.assertRedirects(response, self.redirect_url)
        self.assertIn('_auth_user_id', self.client.session)
        self.assertTrue(self.client.session.get_expire_at_browser_close())

    def test_invalid_login_keeps_existing_error_handling(self):
        response = self.client.post(self.login_url, {
            'username': 'sprout',
            'password': 'wrong-password',
            'remember_me': 'on',
        })

        self.assertEqual(response.status_code, 200)
        self.assertNotIn('_auth_user_id', self.client.session)
        self.assertContains(response, 'Please enter a correct')

    def test_username_login_still_works(self):
        response = self.client.post(self.login_url, {
            'username': 'sprout',
            'password': 'secret123',
        })

        self.assertRedirects(response, self.redirect_url)
        self.assertTrue(self.client.session.get('_auth_user_id'))

    def test_email_login_still_works(self):
        self.user.email = 'sprout@example.com'
        self.user.save(update_fields=['email'])

        response = self.client.post(self.login_url, {
            'username': 'sprout@example.com',
            'password': 'secret123',
        })

        self.assertRedirects(response, self.redirect_url)
        self.assertTrue(self.client.session.get('_auth_user_id'))


class ProfileImageTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username='profileuser',
            password='secret123',
            email='profile@example.com',
        )
        self.profile_url = reverse('accounts:profile')

    def _make_image(self, name='avatar.png', content_type='image/png'):
        image = Image.new('RGB', (40, 40), color='green')
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        return SimpleUploadedFile(name, buffer.getvalue(), content_type=content_type)

    def test_authenticated_user_can_upload_profile_image(self):
        self.client.force_login(self.user)
        image = self._make_image()

        response = self.client.post(self.profile_url, {
            'username': self.user.username,
            'email': self.user.email,
            'first_name': 'Profile',
            'last_name': 'User',
            'save_profile': 'Save Changes',
            'profile_image': image,
        })

        self.assertRedirects(response, self.profile_url)
        self.user.refresh_from_db()
        self.assertTrue(self.user.profile.profile_image)

    def test_unsupported_file_type_is_rejected(self):
        self.client.force_login(self.user)
        invalid_file = SimpleUploadedFile('avatar.pdf', b'not-an-image', content_type='application/pdf')

        response = self.client.post(self.profile_url, {
            'username': self.user.username,
            'email': self.user.email,
            'first_name': 'Profile',
            'last_name': 'User',
            'save_profile': 'Save Changes',
            'profile_image': invalid_file,
        })

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Please upload a JPG, PNG, or WEBP image.')

    def test_large_file_is_rejected(self):
        self.client.force_login(self.user)
        large_image = SimpleUploadedFile(
            'avatar.png',
            b'a' * (6 * 1024 * 1024),
            content_type='image/png',
        )

        response = self.client.post(self.profile_url, {
            'username': self.user.username,
            'email': self.user.email,
            'first_name': 'Profile',
            'last_name': 'User',
            'save_profile': 'Save Changes',
            'profile_image': large_image,
        })

        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'Profile image must be smaller than 5 MB.')

    def test_profile_page_shows_initial_avatar_when_no_image_exists(self):
        self.client.force_login(self.user)
        response = self.client.get(self.profile_url)

        self.assertContains(response, 'profile-avatar-fallback')

    def test_profile_image_update_endpoint_accepts_authenticated_upload(self):
        self.client.force_login(self.user)
        image = self._make_image('avatar.png')

        response = self.client.post(
            reverse('accounts:profile_image_update'),
            {'profile_image': image},
            format='multipart',
        )

        self.assertEqual(response.status_code, 200)
        self.assertJSONEqual(response.content.decode(), {'success': True, 'image_url': response.json()['image_url']})

    def test_profile_image_delete_endpoint_removes_existing_image(self):
        self.client.force_login(self.user)
        profile = self.user.profile
        profile.profile_image = self._make_image('avatar.png')
        profile.save()

        response = self.client.post(reverse('accounts:profile_image_delete'))

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['success'])
        profile.refresh_from_db()
        self.assertFalse(profile.profile_image)

    def test_profile_image_endpoints_require_login(self):
        response = self.client.post(reverse('accounts:profile_image_update'))
        self.assertEqual(response.status_code, 302)

        delete_response = self.client.post(reverse('accounts:profile_image_delete'))
        self.assertEqual(response.status_code, 302)
        self.assertEqual(delete_response.status_code, 302)
