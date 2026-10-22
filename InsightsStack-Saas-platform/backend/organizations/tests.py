from rest_framework.test import APITestCase

from organizations.models import Organization, OrganizationMember
from users.models import User
from workspaces.models import Workspace, WorkspaceMember


class OrganizationMemberApiTests(APITestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            email='org-owner@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='Org',
            last_name='Owner',
        )
        self.member = User.objects.create_user(
            email='org-member@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='Org',
            last_name='Member',
        )
        self.organization = Organization.objects.create(
            name='Org Test',
            slug='org-test',
            owner=self.owner,
        )
        OrganizationMember.objects.create(
            organization=self.organization,
            user=self.owner,
            role='admin',
        )
        self.workspace = Workspace.objects.create(
            organization=self.organization,
            name='Main',
            slug='main',
            created_by=self.owner,
        )
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.owner,
            role='admin',
        )
        self.client.force_authenticate(self.owner)

    def test_inviting_existing_user_grants_workspace_access_and_role_updates(self):
        response = self.client.post(
            f'/api/organizations/{self.organization.pk}/members/',
            {'email': self.member.email, 'role': 'analyst'},
            format='json',
        )

        self.assertEqual(response.status_code, 201, response.data)
        membership = OrganizationMember.objects.get(
            organization=self.organization,
            user=self.member,
        )
        workspace_membership = WorkspaceMember.objects.get(
            workspace=self.workspace,
            user=self.member,
        )
        self.assertEqual(workspace_membership.role, 'editor')

        update_response = self.client.patch(
            f'/api/organizations/{self.organization.pk}/members/{membership.pk}/',
            {'role': 'viewer'},
            format='json',
        )

        self.assertEqual(update_response.status_code, 200, update_response.data)
        workspace_membership.refresh_from_db()
        self.assertEqual(workspace_membership.role, 'viewer')

    def test_member_cannot_be_added_by_non_admin(self):
        self.client.force_authenticate(self.member)

        response = self.client.post(
            f'/api/organizations/{self.organization.pk}/members/',
            {'email': self.member.email, 'role': 'viewer'},
            format='json',
        )

        self.assertEqual(response.status_code, 403)
