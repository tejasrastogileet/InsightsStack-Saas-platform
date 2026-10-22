import json
import logging

import pandas as pd
from django.db import transaction
from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination

from audit.utils import record_audit_event
from notifications.models import Notification
from .models import Dataset, DatasetRecord, ImportHistory
from .serializers import DatasetRecordSerializer, DatasetSerializer, ImportHistorySerializer

logger = logging.getLogger(__name__)
MAX_DATASET_ROWS = 100_000


class DatasetRecordPagination(PageNumberPagination):
    page_size = 100
    max_page_size = 1000


def read_dataset(dataset):
    dataset.file.open('rb')
    try:
        if dataset.file_type == 'csv':
            frame = pd.read_csv(dataset.file, nrows=MAX_DATASET_ROWS + 1)
        elif dataset.file_type == 'excel':
            frame = pd.read_excel(dataset.file, nrows=MAX_DATASET_ROWS + 1)
        elif dataset.file_type == 'json':
            payload = json.load(dataset.file)
            if isinstance(payload, dict):
                payload = payload.get('data')
            if not isinstance(payload, list) or any(not isinstance(row, dict) for row in payload):
                raise ValueError('JSON must contain an array of objects, or an object with a data array.')
            if len(payload) > MAX_DATASET_ROWS:
                raise ValueError(f'Datasets cannot contain more than {MAX_DATASET_ROWS:,} rows.')
            frame = pd.DataFrame.from_records(payload)
        else:
            raise ValueError('Unsupported file type.')
    finally:
        dataset.file.close()

    if len(frame) > MAX_DATASET_ROWS:
        raise ValueError(f'Datasets cannot contain more than {MAX_DATASET_ROWS:,} rows.')
    if frame.columns.duplicated().any():
        raise ValueError('Column names must be unique.')
    if not len(frame.columns):
        raise ValueError('The uploaded file does not contain any columns.')

    records = json.loads(frame.to_json(orient='records', date_format='iso'))
    return frame, records

class DatasetViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = DatasetSerializer
    parser_classes = (MultiPartParser, FormParser)
    
    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            return Dataset.objects.filter(workspace_id=workspace_id, workspace__members__user=self.request.user)
        return Dataset.objects.filter(workspace__members__user=self.request.user)
        
    def perform_create(self, serializer):
        dataset = serializer.save(created_by=self.request.user)
        if dataset.file:
            try:
                frame, records = read_dataset(dataset)
                with transaction.atomic():
                    DatasetRecord.objects.bulk_create(
                        [
                            DatasetRecord(dataset=dataset, row_index=index, data=row)
                            for index, row in enumerate(records)
                        ],
                        batch_size=1000,
                    )
                dataset.row_count = len(records)
                dataset.columns = [
                    {'name': str(column), 'type': str(frame[column].dtype)}
                    for column in frame.columns
                ]
                dataset.preview = records[:10]
                dataset.status = 'ready'
                dataset.error_message = ''
            except (ValueError, pd.errors.ParserError, pd.errors.EmptyDataError, json.JSONDecodeError) as e:
                dataset.status = 'error'
                dataset.error_message = str(e)
                logger.info('Dataset %s import rejected: %s', dataset.pk, e)
            except Exception:
                DatasetRecord.objects.filter(dataset=dataset).delete()
                dataset.status = 'error'
                dataset.error_message = 'The dataset could not be imported. Check the file and try again.'
                logger.exception('Dataset %s import failed.', dataset.pk)
            dataset.save()

            ImportHistory.objects.create(
                dataset=dataset,
                imported_by=self.request.user,
                rows_imported=dataset.row_count,
                status='success' if dataset.status == 'ready' else 'failed'
            )
            record_audit_event(
                self.request,
                'import',
                'dataset',
                dataset.pk,
                dataset.name,
                workspace=dataset.workspace,
                changes={'status': dataset.status, 'row_count': dataset.row_count},
            )
            Notification.objects.create(
                user=self.request.user,
                title='Dataset import complete' if dataset.status == 'ready' else 'Dataset import failed',
                message=f'{dataset.name}: {dataset.row_count:,} rows imported.'
                if dataset.status == 'ready'
                else f'{dataset.name}: {dataset.error_message}',
                notification_type='success' if dataset.status == 'ready' else 'error',
            )

    def perform_destroy(self, instance):
        record_audit_event(
            self.request,
            'delete',
            'dataset',
            instance.pk,
            instance.name,
            workspace=instance.workspace,
        )
        super().perform_destroy(instance)

    @action(detail=True, methods=['get'])
    def records(self, request, pk=None):
        dataset = self.get_object()
        records = dataset.records.all()
        paginator = DatasetRecordPagination()
        page = paginator.paginate_queryset(records, request, view=self)
        serializer = DatasetRecordSerializer(page, many=True)
        return paginator.get_paginated_response(serializer.data)

    @action(detail=True, methods=['get'])
    def history(self, request, pk=None):
        dataset = self.get_object()
        history = dataset.import_history.order_by('-created_at')
        return Response(ImportHistorySerializer(history, many=True).data)
