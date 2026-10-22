from rest_framework.test import APITestCase

from users.models import User


class AuditApiRouteTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='audit-user@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='Audit',
            last_name='User',
        )
        self.client.force_authenticate(self.user)

    def test_audit_logs_route_is_available(self):
        response = self.client.get('/api/audit/')

        self.assertEqual(response.status_code, 200)

    def test_activity_logs_route_is_available(self):
        response = self.client.get('/api/audit/activities/')

        self.assertEqual(response.status_code, 200)
