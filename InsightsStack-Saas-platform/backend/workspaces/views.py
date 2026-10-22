from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import Workspace, WorkspaceMember
from .serializers import WorkspaceSerializer, WorkspaceMemberSerializer

class WorkspaceViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkspaceSerializer
    
    def get_queryset(self):
        return Workspace.objects.filter(members__user=self.request.user)

    def perform_create(self, serializer):
        workspace = serializer.save(created_by=self.request.user)
        WorkspaceMember.objects.create(
            workspace=workspace,
            user=self.request.user,
            role='admin',
        )

class WorkspaceMemberViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WorkspaceMemberSerializer
    
    def get_queryset(self):
        return WorkspaceMember.objects.filter(
            workspace_id=self.kwargs.get('workspace_pk'),
            workspace__members__user=self.request.user,
        ).distinct()

    def _require_workspace_admin(self):
        is_admin = WorkspaceMember.objects.filter(
            workspace_id=self.kwargs.get('workspace_pk'),
            user=self.request.user,
            role='admin',
        ).exists()
        if not is_admin:
            raise PermissionDenied('Workspace admin access is required.')

    def perform_create(self, serializer):
        self._require_workspace_admin()
        workspace = Workspace.objects.get(pk=self.kwargs['workspace_pk'])
        serializer.save(workspace=workspace)

    def perform_update(self, serializer):
        self._require_workspace_admin()
        serializer.save(workspace=serializer.instance.workspace)

    def perform_destroy(self, instance):
        self._require_workspace_admin()
        instance.delete()
