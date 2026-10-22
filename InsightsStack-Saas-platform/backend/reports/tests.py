from io import BytesIO

from openpyxl import load_workbook
from rest_framework.test import APITestCase

from audit.models import AuditLog
from datasets.models import Dataset, DatasetRecord
from organizations.models import Organization, OrganizationMember
from reports.models import Report
from users.models import User
from workspaces.models import Workspace, WorkspaceMember


class ReportExportApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='report-test@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='Report',
            last_name='Tester',
        )
        organization = Organization.objects.create(
            name='Report Test',
            slug='report-test',
            owner=self.user,
        )
        OrganizationMember.objects.create(
            organization=organization,
            user=self.user,
            role='admin',
        )
        self.workspace = Workspace.objects.create(
            organization=organization,
            name='Main',
            slug='main',
            created_by=self.user,
        )
        WorkspaceMember.objects.create(
            workspace=self.workspace,
            user=self.user,
            role='admin',
        )
        self.dataset = Dataset.objects.create(
            workspace=self.workspace,
            name='Sales',
            file_type='manual',
            created_by=self.user,
            row_count=1,
            columns=[{'name': 'customer'}, {'name': 'formula'}],
        )
        DatasetRecord.objects.create(
            dataset=self.dataset,
            row_index=0,
            data={'customer': 'Ada', 'formula': '=1+1'},
        )
        self.report = Report.objects.create(
            workspace=self.workspace,
            name='<Monthly> report',
            description='Sales report',
            created_by=self.user,
            config={'dataset_id': str(self.dataset.pk)},
        )
        self.client.force_authenticate(self.user)

    def test_csv_export_contains_dataset_rows_and_sanitizes_formulas(self):
        response = self.client.get(
            f'/api/reports/{self.report.pk}/export/?export_format=csv'
        )

        self.assertEqual(response.status_code, 200, response.content[:200])
        self.assertEqual(response['Content-Type'], 'text/csv; charset=utf-8')
        self.assertIn(b"Ada,'=1+1", response.content)

    def test_pdf_export_returns_a_real_pdf(self):
        response = self.client.get(
            f'/api/reports/{self.report.pk}/export/?export_format=pdf'
        )

        self.assertEqual(response.status_code, 200, response.content[:200])
        self.assertEqual(response['Content-Type'], 'application/pdf')
        self.assertTrue(response.content.startswith(b'%PDF-'))

    def test_xlsx_export_contains_safe_dataset_values(self):
        response = self.client.get(
            f'/api/reports/{self.report.pk}/export/?export_format=xlsx'
        )

        self.assertEqual(response.status_code, 200, response.content[:200])
        self.assertIn('spreadsheetml', response['Content-Type'])
        worksheet = load_workbook(BytesIO(response.content), read_only=True).active
        self.assertEqual(worksheet['A2'].value, 'Ada')
        self.assertEqual(worksheet['B2'].value, "'=1+1")
        self.assertTrue(AuditLog.objects.filter(
            workspace=self.workspace,
            action='export',
            resource_id=str(self.report.pk),
            changes={'format': 'xlsx'},
        ).exists())

    def test_unavailable_share_and_scheduling_do_not_return_success(self):
        share_response = self.client.post(f'/api/reports/{self.report.pk}/share/')
        schedule_response = self.client.post(
            '/api/reports/schedules/',
            {'report': str(self.report.pk), 'frequency': 'weekly', 'recipients': []},
            format='json',
        )

        self.assertEqual(share_response.status_code, 503)
        self.assertFalse(Report.objects.get(pk=self.report.pk).is_public)
        self.assertEqual(schedule_response.status_code, 503)
