from rest_framework.test import APITestCase

from organizations.models import OrganizationMember
from users.models import User, UserProfile
from workspaces.models import Workspace, WorkspaceMember
import pyotp


class RegistrationApiTests(APITestCase):
    def test_registration_creates_user_organization_and_default_workspace(self):
        response = self.client.post(
            '/api/auth/register/',
            {
                'email': 'new-user@example.com',
                'password': 'Strong-Unique-Passphrase-2025!',
                'first_name': 'New',
                'last_name': 'User',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201, response.data)
        user = User.objects.get(email='new-user@example.com')
        self.assertTrue(user.check_password('Strong-Unique-Passphrase-2025!'))
        self.assertEqual(user.profile.role, 'admin')
        self.assertTrue(user.organization_memberships.filter(role='admin').exists())
        workspace = Workspace.objects.get(created_by=user, is_default=True)
        self.assertTrue(WorkspaceMember.objects.filter(workspace=workspace, user=user, role='admin').exists())
        self.assertEqual(
            OrganizationMember.objects.get(user=user, organization=workspace.organization).role,
            'admin',
        )
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_login_and_authenticated_password_change(self):
        user = User.objects.create_user(
            email='login-user@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='Login',
            last_name='User',
        )
        response = self.client.post(
            '/api/auth/login/',
            {'email': user.email, 'password': 'Strong-Unique-Passphrase-2025!'},
            format='json',
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertIn('access', response.data)

        self.client.force_authenticate(user)
        change_response = self.client.put(
            '/api/auth/change-password/',
            {
                'old_password': 'Strong-Unique-Passphrase-2025!',
                'new_password': 'Another-Strong-Passphrase-2026!',
            },
            format='json',
        )

        self.assertEqual(change_response.status_code, 200, change_response.data)
        user.refresh_from_db()
        self.assertTrue(user.check_password('Another-Strong-Passphrase-2026!'))

    def test_login_requires_valid_totp_when_mfa_is_enabled(self):
        user = User.objects.create_user(
            email='mfa-user@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='MFA',
            last_name='User',
        )
        secret = pyotp.random_base32()
        UserProfile.objects.create(user=user, mfa_secret=secret, mfa_enabled=True)
        payload = {'email': user.email, 'password': 'Strong-Unique-Passphrase-2025!'}

        required_response = self.client.post('/api/auth/login/', payload, format='json')
        valid_response = self.client.post(
            '/api/auth/login/',
            {**payload, 'mfa_code': pyotp.TOTP(secret).now()},
            format='json',
        )

        self.assertEqual(required_response.status_code, 200)
        self.assertTrue(required_response.data['mfa_required'])
        self.assertEqual(valid_response.status_code, 200, valid_response.data)
        self.assertIn('access', valid_response.data)
