from django.db import models
from workspaces.models import Workspace
from datasets.models import Dataset

class KPI(models.Model):
    TREND_CHOICES = [
        ('up', 'Up'),
        ('down', 'Down'),
        ('flat', 'Flat'),
    ]
    
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='kpis')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    formula = models.TextField()
    dataset = models.ForeignKey(Dataset, on_delete=models.SET_NULL, null=True, blank=True)
    current_value = models.FloatField(default=0)
    previous_value = models.FloatField(default=0)
    target_value = models.FloatField(null=True, blank=True)
    unit = models.CharField(max_length=20, blank=True)
    trend = models.CharField(max_length=10, choices=TREND_CHOICES, default='flat')
    last_calculated = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class AnalyticsSnapshot(models.Model):
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='analytics_snapshots')
    date = models.DateField()
    metric_name = models.CharField(max_length=255)
    metric_value = models.FloatField()
    dimensions = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)
