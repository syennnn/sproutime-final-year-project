from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse


@override_settings(DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}})
class LoginRememberMeTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username='testuser', password='secret123')

    def test_login_without_remember_me_uses_browser_session(self):
        response = self.client.post(reverse('accounts:login'), {
            'username': 'testuser',
            'password': 'secret123',
        })

        self.assertRedirects(response, reverse('garden:garden_home'))
        self.assertTrue(self.client.session.get('_auth_user_id'))
        self.assertEqual(self.client.session.get_expiry_age(), 0)

    def test_login_with_remember_me_keeps_session_longer(self):
        response = self.client.post(reverse('accounts:login'), {
            'username': 'testuser',
            'password': 'secret123',
            'remember_me': 'on',
        })

        self.assertRedirects(response, reverse('garden:garden_home'))
        self.assertTrue(self.client.session.get('_auth_user_id'))
        self.assertEqual(self.client.session.get_expiry_age(), 1209600)
