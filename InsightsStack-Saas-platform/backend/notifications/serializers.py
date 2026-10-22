from rest_framework import serializers
from .models import Notification, Alert

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = '__all__'

    def validate(self, attrs):
        workspace = attrs.get('workspace', getattr(self.instance, 'workspace', None))
        request = self.context.get('request')
        if workspace and request and not workspace.members.filter(user=request.user).exists():
            raise serializers.ValidationError({'workspace': 'You are not a member of this workspace.'})

        kpi = attrs.get('kpi', getattr(self.instance, 'kpi', None))
        if kpi and workspace and kpi.workspace_id != workspace.id:
            raise serializers.ValidationError({'kpi': 'Choose a KPI in this workspace.'})
        return attrs
