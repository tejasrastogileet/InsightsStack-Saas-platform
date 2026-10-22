from rest_framework.test import APITestCase

from dashboards.models import Dashboard, Widget
from organizations.models import Organization, OrganizationMember
from users.models import User
from workspaces.models import Workspace, WorkspaceMember


class DashboardApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='dashboard-test@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='Dashboard',
            last_name='Tester',
        )
        organization = Organization.objects.create(
            name='Dashboard Test',
            slug='dashboard-test',
            owner=self.user,
        )
        OrganizationMember.objects.create(
            organization=organization,
            user=self.user,
            role='admin',
        )
        self.workspace = Workspace.objects.create(
            organization=organization,
            name='Main',
            slug='main',
            created_by=self.user,
        )
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.user,
            role='admin',
        )
        self.client.force_authenticate(self.user)

    def test_dashboard_and_widget_creation_persists_creator_and_data(self):
        dashboard_response = self.client.post(
            '/api/dashboards/',
            {'workspace': str(self.workspace.pk), 'name': 'Overview'},
            format='json',
        )

        self.assertEqual(dashboard_response.status_code, 201, dashboard_response.data)
        dashboard = Dashboard.objects.get(pk=dashboard_response.data['id'])
        self.assertEqual(dashboard.created_by, self.user)

        widget_response = self.client.post(
            '/api/dashboards/widgets/',
            {
                'dashboard': str(dashboard.pk),
                'title': 'Revenue',
                'widget_type': 'kpi_card',
                'config': {},
                'position': {'x': 0, 'y': 0, 'w': 1, 'h': 1},
            },
            format='json',
        )

        self.assertEqual(widget_response.status_code, 201, widget_response.data)
        self.assertEqual(Widget.objects.get(pk=widget_response.data['id']).dashboard, dashboard)

    def test_dashboard_and_widget_cannot_be_created_in_another_users_workspace(self):
        other_user = User.objects.create_user(
            email='other-dashboard@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='Other',
            last_name='User',
        )
        other_organization = Organization.objects.create(
            name='Other Dashboard Test',
            slug='other-dashboard-test',
            owner=other_user,
        )
        foreign_workspace = Workspace.objects.create(
            organization=other_organization,
            name='Private',
            slug='private',
            created_by=other_user,
        )
        foreign_dashboard = Dashboard.objects.create(
            workspace=foreign_workspace,
            name='Private dashboard',
            created_by=other_user,
        )

        dashboard_response = self.client.post(
            '/api/dashboards/',
            {'workspace': str(foreign_workspace.pk), 'name': 'Unauthorized'},
            format='json',
        )
        widget_response = self.client.post(
            '/api/dashboards/widgets/',
            {
                'dashboard': str(foreign_dashboard.pk),
                'title': 'Unauthorized',
                'widget_type': 'kpi_card',
            },
            format='json',
        )

        self.assertEqual(dashboard_response.status_code, 400)
        self.assertEqual(widget_response.status_code, 400)
