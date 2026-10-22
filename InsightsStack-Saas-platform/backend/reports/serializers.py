from rest_framework import serializers
from .models import Report, ScheduledReport
from datasets.models import Dataset

class ScheduledReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ScheduledReport
        fields = '__all__'

class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = '__all__'
        read_only_fields = ('created_by', 'share_token', 'is_public', 'created_at', 'updated_at')

    def validate(self, attrs):
        workspace = attrs.get('workspace', getattr(self.instance, 'workspace', None))
        request = self.context.get('request')
        if workspace and request and not workspace.members.filter(user=request.user).exists():
            raise serializers.ValidationError({'workspace': 'You are not a member of this workspace.'})

        config = attrs.get('config', getattr(self.instance, 'config', {}))
        dataset_id = config.get('dataset_id') if isinstance(config, dict) else None
        if dataset_id and workspace and request:
            exists = Dataset.objects.filter(
                pk=dataset_id,
                workspace=workspace,
                workspace__members__user=request.user,
            ).exists()
            if not exists:
                raise serializers.ValidationError({'config': 'Select a dataset in this workspace.'})
        return attrs
