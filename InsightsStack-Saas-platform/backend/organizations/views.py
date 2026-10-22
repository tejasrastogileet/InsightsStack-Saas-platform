from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from .models import Organization, OrganizationMember
from .serializers import OrganizationSerializer, OrganizationMemberSerializer
from workspaces.models import WorkspaceMember

class OrganizationViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrganizationSerializer
    
    def get_queryset(self):
        return Organization.objects.filter(members__user=self.request.user, members__is_active=True).distinct()
        
    def perform_create(self, serializer):
        org = serializer.save(owner=self.request.user)
        OrganizationMember.objects.create(organization=org, user=self.request.user, role='admin')

    def _require_organization_admin(self, organization):
        if not OrganizationMember.objects.filter(
            organization=organization,
            user=self.request.user,
            role='admin',
            is_active=True,
        ).exists():
            raise PermissionDenied('Organization admin access is required.')

    def perform_update(self, serializer):
        self._require_organization_admin(serializer.instance)
        serializer.save()

    def perform_destroy(self, instance):
        self._require_organization_admin(instance)
        instance.delete()

class OrganizationMemberViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = OrganizationMemberSerializer
    
    def get_queryset(self):
        return OrganizationMember.objects.filter(
            organization_id=self.kwargs.get('organization_pk'),
            organization__members__user=self.request.user,
        ).distinct()

    def _require_organization_admin(self):
        is_admin = OrganizationMember.objects.filter(
            organization_id=self.kwargs.get('organization_pk'),
            user=self.request.user,
            role='admin',
            is_active=True,
        ).exists()
        if not is_admin:
            raise PermissionDenied('Organization admin access is required.')

    def perform_create(self, serializer):
        self._require_organization_admin()
        organization = Organization.objects.get(pk=self.kwargs['organization_pk'])
        membership = serializer.save(organization=organization, invited_by=self.request.user)
        workspace_role = {
            'admin': 'admin',
            'manager': 'editor',
            'analyst': 'editor',
            'viewer': 'viewer',
        }[membership.role]
        for workspace in organization.workspaces.all():
            WorkspaceMember.objects.update_or_create(
                workspace=workspace,
                user=membership.user,
                defaults={'role': workspace_role},
            )

    def perform_update(self, serializer):
        self._require_organization_admin()
        membership = serializer.save(organization=serializer.instance.organization)
        workspace_role = {
            'admin': 'admin',
            'manager': 'editor',
            'analyst': 'editor',
            'viewer': 'viewer',
        }[membership.role]
        WorkspaceMember.objects.filter(
            workspace__organization=membership.organization,
            user=membership.user,
        ).update(role=workspace_role)

    def perform_destroy(self, instance):
        self._require_organization_admin()
        WorkspaceMember.objects.filter(
            workspace__organization=instance.organization,
            user=instance.user,
        ).delete()
        instance.delete()
