from rest_framework import viewsets, permissions
from audit.utils import record_audit_event
from .models import Dashboard, Widget
from .serializers import DashboardSerializer, WidgetSerializer

class DashboardViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DashboardSerializer
    
    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            return Dashboard.objects.filter(workspace_id=workspace_id, workspace__members__user=self.request.user)
        return Dashboard.objects.filter(workspace__members__user=self.request.user)

    def perform_create(self, serializer):
        dashboard = serializer.save(created_by=self.request.user)
        record_audit_event(
            self.request, 'create', 'dashboard', dashboard.pk, dashboard.name,
            workspace=dashboard.workspace,
        )

    def perform_update(self, serializer):
        dashboard = serializer.save()
        record_audit_event(
            self.request, 'update', 'dashboard', dashboard.pk, dashboard.name,
            workspace=dashboard.workspace,
        )

    def perform_destroy(self, instance):
        record_audit_event(
            self.request, 'delete', 'dashboard', instance.pk, instance.name,
            workspace=instance.workspace,
        )
        super().perform_destroy(instance)


class WidgetViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = WidgetSerializer
    
    def get_queryset(self):
        widgets = Widget.objects.filter(dashboard__workspace__members__user=self.request.user)
        dashboard_id = self.request.query_params.get('dashboard')
        if dashboard_id:
            widgets = widgets.filter(dashboard_id=dashboard_id)
        return widgets

    def perform_create(self, serializer):
        widget = serializer.save()
        record_audit_event(
            self.request, 'create', 'widget', widget.pk, widget.title,
            workspace=widget.dashboard.workspace,
        )

    def perform_update(self, serializer):
        widget = serializer.save()
        record_audit_event(
            self.request, 'update', 'widget', widget.pk, widget.title,
            workspace=widget.dashboard.workspace,
        )

    def perform_destroy(self, instance):
        record_audit_event(
            self.request, 'delete', 'widget', instance.pk, instance.title,
            workspace=instance.dashboard.workspace,
        )
        super().perform_destroy(instance)
