from rest_framework import serializers
from .models import KPI, AnalyticsSnapshot

class KPISerializer(serializers.ModelSerializer):
    class Meta:
        model = KPI
        fields = '__all__'

    def validate(self, attrs):
        workspace = attrs.get('workspace', getattr(self.instance, 'workspace', None))
        request = self.context.get('request')
        if workspace and request and not workspace.members.filter(user=request.user).exists():
            raise serializers.ValidationError({'workspace': 'You are not a member of this workspace.'})

        dataset = attrs.get('dataset', getattr(self.instance, 'dataset', None))
        if dataset and workspace and dataset.workspace_id != workspace.id:
            raise serializers.ValidationError({'dataset': 'Choose a dataset in this workspace.'})
        return attrs

class AnalyticsSnapshotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalyticsSnapshot
        fields = '__all__'
