import csv
import io
import json
from xml.sax.saxutils import escape

from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils.text import slugify
from openpyxl import Workbook
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import LongTable, Paragraph, SimpleDocTemplate, Spacer, TableStyle
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from audit.utils import record_audit_event
from datasets.models import Dataset
from notifications.models import Notification
from .models import Report, ScheduledReport
from .serializers import ReportSerializer, ScheduledReportSerializer


def safe_export_value(value):
    if isinstance(value, (dict, list)):
        value = json.dumps(value, ensure_ascii=False)
    if isinstance(value, str) and value.lstrip().startswith(('=', '+', '-', '@', '\t', '\r')):
        return f"'{value}"
    return value


class ReportViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ReportSerializer
    
    def get_queryset(self):
        workspace_id = self.request.query_params.get('workspace')
        if workspace_id:
            return Report.objects.filter(workspace_id=workspace_id, workspace__members__user=self.request.user)
        return Report.objects.filter(workspace__members__user=self.request.user)

    def perform_create(self, serializer):
        report = serializer.save(created_by=self.request.user)
        record_audit_event(
            self.request,
            'create',
            'report',
            report.pk,
            report.name,
            workspace=report.workspace,
        )
        Notification.objects.create(
            user=self.request.user,
            title='Report created',
            message=f'{report.name} is ready to export as PDF, CSV, or XLSX.',
            notification_type='success',
        )

    def perform_update(self, serializer):
        report = serializer.save()
        record_audit_event(
            self.request, 'update', 'report', report.pk, report.name,
            workspace=report.workspace,
        )

    def perform_destroy(self, instance):
        record_audit_event(
            self.request, 'delete', 'report', instance.pk, instance.name,
            workspace=instance.workspace,
        )
        super().perform_destroy(instance)
        
    @action(detail=True, methods=['post'])
    def share(self, request, pk=None):
        self.get_object()
        return Response(
            {'error': 'Public report sharing is not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
        
    @action(detail=True, methods=['get'])
    def export(self, request, pk=None):
        report = self.get_object()
        export_format = request.query_params.get('export_format', 'pdf').lower()
        if export_format not in {'pdf', 'csv', 'xlsx'}:
            return Response(
                {'error': 'Supported formats are PDF, CSV, and XLSX.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dataset_id = report.config.get('dataset_id')
        if not dataset_id:
            return Response(
                {'error': 'This report has no dataset configured.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        dataset = get_object_or_404(
            Dataset.objects.filter(
                workspace=report.workspace,
                workspace__members__user=request.user,
            ),
            pk=dataset_id,
        )
        records = list(dataset.records.values_list('data', flat=True))
        columns = [column['name'] for column in dataset.columns]
        filename = slugify(report.name) or 'insightstack-report'

        if export_format == 'csv':
            output = io.StringIO(newline='')
            safe_columns = [safe_export_value(column) for column in columns]
            writer = csv.DictWriter(output, fieldnames=safe_columns, extrasaction='ignore')
            writer.writeheader()
            for record in records:
                safe_record = {}
                for column, safe_column in zip(columns, safe_columns):
                    safe_record[safe_column] = safe_export_value(record.get(column, ''))
                writer.writerow(safe_record)
            response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
            response['Content-Disposition'] = f'attachment; filename="{filename}.csv"'
            record_audit_event(
                request, 'export', 'report', report.pk, report.name,
                workspace=report.workspace, changes={'format': export_format},
            )
            return response

        if export_format == 'xlsx':
            workbook = Workbook(write_only=True)
            worksheet = workbook.create_sheet(title='Report')
            worksheet.append([safe_export_value(column) for column in columns])
            for record in records:
                worksheet.append([safe_export_value(record.get(column)) for column in columns])
            output = io.BytesIO()
            workbook.save(output)
            response = HttpResponse(
                output.getvalue(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            )
            response['Content-Disposition'] = f'attachment; filename="{filename}.xlsx"'
            record_audit_event(
                request, 'export', 'report', report.pk, report.name,
                workspace=report.workspace, changes={'format': export_format},
            )
            return response

        output = io.BytesIO()
        styles = getSampleStyleSheet()
        document = SimpleDocTemplate(
            output,
            pagesize=landscape(A4),
            rightMargin=14 * mm,
            leftMargin=14 * mm,
            topMargin=14 * mm,
            bottomMargin=14 * mm,
        )
        story = [
            Paragraph(escape(report.name), styles['Title']),
            Spacer(1, 5 * mm),
            Paragraph(escape(report.description or 'Dataset report'), styles['BodyText']),
            Spacer(1, 3 * mm),
            Paragraph(
                f'Dataset: {escape(dataset.name)} | Rows: {dataset.row_count:,} | '
                f'Columns: {len(columns)}',
                styles['BodyText'],
            ),
            Spacer(1, 5 * mm),
        ]
        visible_columns = columns[:8]
        table_data = [[str(column)[:40] for column in visible_columns]]
        for record in records:
            table_data.append([
                Paragraph(escape(str(record.get(column, ''))[:160]), styles['BodyText'])
                for column in visible_columns
            ])
        if not records:
            table_data.append(['No rows in this dataset.'] + [''] * (len(visible_columns) - 1))
        elif len(columns) > len(visible_columns):
            story.append(Paragraph('This PDF includes every row and the first 8 columns. CSV and XLSX exports include every row and column.', styles['Italic']))
            story.append(Spacer(1, 2 * mm))
        table = LongTable(table_data, repeatRows=1)
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1F3A5F')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.25, colors.HexColor('#CBD5E1')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F1F5F9')]),
            ('LEFTPADDING', (0, 0), (-1, -1), 4),
            ('RIGHTPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(table)
        document.build(story)
        response = HttpResponse(output.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}.pdf"'
        record_audit_event(
            request, 'export', 'report', report.pk, report.name,
            workspace=report.workspace, changes={'format': export_format},
        )
        return response

class ScheduledReportViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = ScheduledReportSerializer
    
    def get_queryset(self):
        return ScheduledReport.objects.filter(report__workspace__members__user=self.request.user)

    def create(self, request, *args, **kwargs):
        return Response(
            {'error': 'Scheduled report delivery is not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
