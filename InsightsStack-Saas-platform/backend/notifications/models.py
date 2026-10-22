import uuid
from django.db import models
from users.models import User
from workspaces.models import Workspace

class Notification(models.Model):
    TYPE_CHOICES = [
        ('info', 'Info'),
        ('warning', 'Warning'),
        ('success', 'Success'),
        ('error', 'Error'),
        ('kpi_alert', 'KPI Alert'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.TextField()
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Alert(models.Model):
    OPERATOR_CHOICES = [
        ('gt', 'Greater Than'),
        ('lt', 'Less Than'),
        ('eq', 'Equal'),
        ('gte', 'Greater Than or Equal'),
        ('lte', 'Less Than or Equal'),
    ]
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='alerts')
    kpi = models.ForeignKey('analytics.KPI', on_delete=models.SET_NULL, null=True, blank=True)
    name = models.CharField(max_length=255)
    condition = models.CharField(max_length=255)
    threshold = models.FloatField()
    operator = models.CharField(max_length=10, choices=OPERATOR_CHOICES)
    is_active = models.BooleanField(default=True)
    last_triggered = models.DateTimeField(null=True, blank=True)
    recipients = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
