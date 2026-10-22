import uuid
from django.db import models
from workspaces.models import Workspace
from users.models import User

class Dashboard(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='dashboards')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_dashboards')
    is_public = models.BooleanField(default=False)
    thumbnail = models.ImageField(upload_to='dashboards/', null=True, blank=True)
    layout_config = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Widget(models.Model):
    WIDGET_TYPES = [
        ('kpi_card', 'KPI Card'),
        ('line_chart', 'Line Chart'),
        ('bar_chart', 'Bar Chart'),
        ('pie_chart', 'Pie Chart'),
        ('area_chart', 'Area Chart'),
        ('data_table', 'Data Table'),
        ('metric_gauge', 'Metric Gauge'),
    ]
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    dashboard = models.ForeignKey(Dashboard, on_delete=models.CASCADE, related_name='widgets')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    widget_type = models.CharField(max_length=50, choices=WIDGET_TYPES)
    config = models.JSONField(default=dict)
    position = models.JSONField(default=dict)
    data_source = models.ForeignKey('datasets.Dataset', on_delete=models.SET_NULL, null=True, blank=True, related_name='widgets')
    refresh_interval = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
