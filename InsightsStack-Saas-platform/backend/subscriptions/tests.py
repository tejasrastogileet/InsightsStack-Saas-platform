from rest_framework.test import APITestCase

from organizations.models import Organization, OrganizationMember
from subscriptions.models import SubscriptionPlan
from users.models import User


class SubscriptionApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='subscription-admin@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='Subscription',
            last_name='Admin',
        )
        self.organization = Organization.objects.create(
            name='Subscription Test',
            slug='subscription-test',
            owner=self.user,
        )
        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.user,
            role='admin',
        )
        self.plan = SubscriptionPlan.objects.create(
            name='starter',
            display_name='Starter',
            price_monthly=10,
            price_yearly=100,
            max_users=5,
            max_workspaces=2,
            max_dashboards=10,
            features=[],
        )
        self.client.force_authenticate(self.user)

    def test_plans_are_database_backed_and_current_subscription_is_organization_scoped(self):
        plans_response = self.client.get('/api/subscriptions/plans/')
        current_response = self.client.get(
            '/api/subscriptions/current/',
            {'organization': str(self.organization.pk)},
        )

        self.assertEqual(plans_response.status_code, 200)
        self.assertEqual(plans_response.data[0]['display_name'], self.plan.display_name)
        self.assertEqual(current_response.status_code, 404)

    def test_upgrade_does_not_claim_success_without_a_billing_provider(self):
        response = self.client.post(
            '/api/subscriptions/upgrade/',
            {'organization_id': str(self.organization.pk), 'plan_id': self.plan.pk},
            format='json',
        )

        self.assertEqual(response.status_code, 503)
