from rest_framework import serializers
from .models import Dashboard, Widget

class WidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = Widget
        fields = '__all__'

    def validate(self, attrs):
        dashboard = attrs.get('dashboard', getattr(self.instance, 'dashboard', None))
        request = self.context.get('request')
        if dashboard and request and not dashboard.workspace.members.filter(user=request.user).exists():
            raise serializers.ValidationError({'dashboard': 'You are not a member of this workspace.'})

        data_source = attrs.get('data_source', getattr(self.instance, 'data_source', None))
        if data_source and dashboard and data_source.workspace_id != dashboard.workspace_id:
            raise serializers.ValidationError({'data_source': 'Choose a dataset in the dashboard workspace.'})
        return attrs

class DashboardSerializer(serializers.ModelSerializer):
    widgets = WidgetSerializer(many=True, read_only=True)
    
    class Meta:
        model = Dashboard
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')

    def validate_workspace(self, workspace):
        request = self.context.get('request')
        if request and not workspace.members.filter(user=request.user).exists():
            raise serializers.ValidationError('You are not a member of this workspace.')
        return workspace
