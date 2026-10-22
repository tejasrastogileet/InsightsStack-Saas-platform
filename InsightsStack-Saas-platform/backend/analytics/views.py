from collections import Counter, defaultdict
from datetime import datetime, timedelta

from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone

from datasets.models import Dataset
from .models import KPI, AnalyticsSnapshot
from .serializers import KPISerializer

class KPIViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = KPISerializer
    
    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            return KPI.objects.filter(workspace_id=workspace_id, workspace__members__user=self.request.user)
        return KPI.objects.filter(workspace__members__user=self.request.user)

class RevenueView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        return Response(
            {'error': 'Select a dataset and use the dataset summary endpoint.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

class CustomerGrowthView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        return Response(
            {'error': 'Customer growth requires a dataset with customer and date fields.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

class TrendAnalysisView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        return Response(
            {'error': 'Trend analysis requires a dataset with a date and numeric field.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

class ConversionRateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        return Response(
            {'error': 'Conversion rate requires source conversion data.'},
            status=status.HTTP_400_BAD_REQUEST,
        )


class DatasetSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        workspace_id = request.query_params.get('workspace')
        dataset_id = request.query_params.get('dataset')
        if not workspace_id or not dataset_id:
            return Response(
                {'error': 'workspace and dataset are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dataset = get_object_or_404(
            Dataset.objects.filter(
                workspace_id=workspace_id,
                workspace__members__user=request.user,
                status='ready',
            ),
            pk=dataset_id,
        )
        period_days = {'30d': 30, '3m': 92, '6m': 183, '1y': 365}
        period = request.query_params.get('period', '1y')
        if period not in period_days:
            return Response({'error': 'Unsupported period.'}, status=status.HTTP_400_BAD_REQUEST)

        column_names = [column['name'] for column in dataset.columns]
        date_columns = [
            column['name'] for column in dataset.columns
            if 'date' in column['name'].lower()
            or 'time' in column['name'].lower()
            or 'date' in column.get('type', '').lower()
        ]
        date_column = date_columns[0] if date_columns else None
        cutoff = timezone.now() - timedelta(days=period_days[period])
        records = list(dataset.records.values_list('data', flat=True))

        if date_column:
            filtered_records = []
            for record in records:
                raw_date = record.get(date_column)
                try:
                    parsed = datetime.fromisoformat(str(raw_date).replace('Z', '+00:00'))
                    if timezone.is_naive(parsed):
                        parsed = timezone.make_aware(parsed, timezone.get_current_timezone())
                    if parsed >= cutoff:
                        filtered_records.append(record)
                except (TypeError, ValueError):
                    continue
            records = filtered_records

        numeric_columns = []
        for column in dataset.columns:
            if any(numeric_type in column.get('type', '').lower() for numeric_type in ('int', 'float', 'double', 'decimal')):
                values = [
                    value for record in records
                    if isinstance((value := record.get(column['name'])), (int, float))
                    and not isinstance(value, bool)
                ]
                if values:
                    numeric_columns.append({
                        'column': column['name'],
                        'sum': sum(values),
                        'average': sum(values) / len(values),
                        'minimum': min(values),
                        'maximum': max(values),
                    })

        time_series_map = defaultdict(lambda: defaultdict(float))
        if date_column:
            for record in records:
                try:
                    parsed = datetime.fromisoformat(str(record.get(date_column)).replace('Z', '+00:00'))
                except (TypeError, ValueError):
                    continue
                month = parsed.strftime('%Y-%m')
                for metric in numeric_columns:
                    value = record.get(metric['column'])
                    if isinstance(value, (int, float)) and not isinstance(value, bool):
                        time_series_map[month][metric['column']] += value

        categorical_summary = []
        for column in dataset.columns:
            if column['name'] == date_column or any(metric['column'] == column['name'] for metric in numeric_columns):
                continue
            values = [str(record.get(column['name'])) for record in records if record.get(column['name']) is not None]
            unique_values = set(values)
            if (
                values
                and len(unique_values) <= min(12, max(5, len(values) // 2))
                and len(unique_values) / len(values) <= 0.5
            ):
                categorical_summary.append({
                    'column': column['name'],
                    'values': [{'value': value, 'count': count} for value, count in Counter(values).most_common(8)],
                })

        return Response({
            'dataset': {
                'id': str(dataset.id),
                'name': dataset.name,
                'row_count': len(records),
                'columns': dataset.columns,
            },
            'date_column': date_column,
            'numeric_summary': numeric_columns,
            'time_series': [
                {'period': month, 'values': dict(values)}
                for month, values in sorted(time_series_map.items())
            ],
            'categorical_summary': categorical_summary,
            'period': period,
        })
