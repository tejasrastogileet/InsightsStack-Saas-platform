import tempfile

from audit.models import AuditLog
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from notifications.models import Notification
from rest_framework.test import APITestCase

from datasets.models import Dataset, DatasetRecord
from organizations.models import Organization, OrganizationMember
from users.models import User
from workspaces.models import Workspace, WorkspaceMember


class DatasetApiTests(APITestCase):
    def setUp(self):
        self.media_directory = tempfile.TemporaryDirectory()
        media_override = override_settings(MEDIA_ROOT=self.media_directory.name)
        media_override.enable()
        self.addCleanup(media_override.disable)
        self.addCleanup(self.media_directory.cleanup)
        self.user = User.objects.create_user(
            email='dataset-test@example.com',
            password='Strong-Unique-Passphrase-2025!',
            first_name='Dataset',
            last_name='Tester',
        )
        organization = Organization.objects.create(
            name='Dataset Test',
            slug='dataset-test',
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
        self.client.force_authenticate(self.user)

    def test_csv_upload_persists_rows_and_returns_preview(self):
        upload = SimpleUploadedFile(
            'sales.csv',
            b'customer,revenue\nAda,42\nLin,18\n',
            content_type='text/csv',
        )

        response = self.client.post(
            '/api/datasets/',
            {'workspace': str(self.workspace.pk), 'name': 'Sales', 'file': upload},
            format='multipart',
        )

        self.assertEqual(response.status_code, 201, response.data)
        dataset = Dataset.objects.get(pk=response.data['id'])
        self.assertEqual(dataset.status, 'ready')
        self.assertEqual(dataset.row_count, 2)
        self.assertEqual(dataset.records.count(), 2)
        self.assertEqual(dataset.records.get(row_index=0).data['customer'], 'Ada')
        self.assertEqual(len(dataset.preview), 2)
        self.assertTrue(AuditLog.objects.filter(
            workspace=self.workspace,
            action='import',
            resource_id=str(dataset.pk),
        ).exists())
        self.assertTrue(Notification.objects.filter(
            user=self.user,
            title='Dataset import complete',
        ).exists())

        summary_response = self.client.get(
            '/api/analytics/datasets/summary/',
            {'workspace': str(self.workspace.pk), 'dataset': str(dataset.pk)},
        )

        self.assertEqual(summary_response.status_code, 200, summary_response.data)
        revenue = next(
            metric for metric in summary_response.data['numeric_summary']
            if metric['column'] == 'revenue'
        )
        self.assertEqual(revenue['sum'], 60)

    def test_dataset_records_endpoint_paginates(self):
        dataset = Dataset.objects.create(
            workspace=self.workspace,
            name='Rows',
            file_type='manual',
            created_by=self.user,
            columns=[{'name': 'value', 'type': 'int64'}],
        )
        DatasetRecord.objects.bulk_create([
            DatasetRecord(dataset=dataset, row_index=index, data={'value': index})
            for index in range(105)
        ])

        response = self.client.get(f'/api/datasets/{dataset.pk}/records/')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['count'], 105)
        self.assertEqual(len(response.data['results']), 100)
        self.assertIsNotNone(response.data['next'])
