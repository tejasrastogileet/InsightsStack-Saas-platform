import uuid
from django.db import models
from workspaces.models import Workspace
from users.models import User

class Dataset(models.Model):
    FILE_TYPE_CHOICES = [
        ('csv', 'CSV'),
        ('excel', 'Excel'),
        ('json', 'JSON'),
        ('manual', 'Manual'),
    ]
    STATUS_CHOICES = [
        ('processing', 'Processing'),
        ('ready', 'Ready'),
        ('error', 'Error'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='datasets')
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_datasets')
    file = models.FileField(upload_to='datasets/', null=True, blank=True)
    file_type = models.CharField(max_length=20, choices=FILE_TYPE_CHOICES)
    row_count = models.IntegerField(default=0)
    columns = models.JSONField(default=list)
    preview = models.JSONField(default=list)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='processing')
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class ImportHistory(models.Model):
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('partial', 'Partial'),
        ('failed', 'Failed'),
    ]
    
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='import_history')
    imported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    rows_imported = models.IntegerField(default=0)
    rows_failed = models.IntegerField(default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    error_log = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)


class DatasetRecord(models.Model):
    dataset = models.ForeignKey(Dataset, on_delete=models.CASCADE, related_name='records')
    row_index = models.PositiveIntegerField()
    data = models.JSONField()

    class Meta:
        ordering = ['row_index']
        constraints = [
            models.UniqueConstraint(fields=['dataset', 'row_index'], name='unique_dataset_row_index'),
        ]
