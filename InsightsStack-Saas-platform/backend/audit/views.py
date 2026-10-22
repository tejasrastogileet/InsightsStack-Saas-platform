from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from .models import AuditLog, ActivityLog
from .serializers import AuditLogSerializer, ActivityLogSerializer

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = AuditLogSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['user', 'action', 'workspace']
    
    def get_queryset(self):
        if self.request.user.is_staff:
            return AuditLog.objects.all().order_by('-created_at')
        return AuditLog.objects.filter(workspace__members__user=self.request.user).order_by('-created_at')

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ActivityLogSerializer
    
    def get_queryset(self):
        return ActivityLog.objects.filter(user=self.request.user).order_by('-created_at')
