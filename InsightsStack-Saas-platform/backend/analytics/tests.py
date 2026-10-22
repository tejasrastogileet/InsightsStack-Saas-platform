from rest_framework.test import APITestCase

from organizations.models import Organization
from users.models import User
from workspaces.models import Workspace


class WorkspaceScopedAnalyticsApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='analytics-user@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='Analytics',
            last_name='User',
        )
        other_user = User.objects.create_user(
            email='analytics-other@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='Other',
            last_name='User',
        )
        organization = Organization.objects.create(
            name='Private Analytics',
            slug='private-analytics',
            owner=other_user,
        )
        self.foreign_workspace = Workspace.objects.create(
            organization=organization,
            name='Private',
            slug='private',
            created_by=other_user,
        )
        self.client.force_authenticate(self.user)

    def test_kpis_and_alerts_cannot_be_created_in_another_workspace(self):
        kpi_response = self.client.post(
            '/api/analytics/kpis/',
            {
                'workspace': str(self.foreign_workspace.pk),
                'name': 'Revenue',
                'formula': 'sum(revenue)',
            },
            format='json',
        )
        alert_response = self.client.post(
            '/api/notifications/alerts/',
            {
                'workspace': str(self.foreign_workspace.pk),
                'name': 'Revenue threshold',
                'condition': 'revenue > 100',
                'threshold': 100,
                'operator': 'gt',
            },
            format='json',
        )

        self.assertEqual(kpi_response.status_code, 400)
        self.assertEqual(alert_response.status_code, 400)
