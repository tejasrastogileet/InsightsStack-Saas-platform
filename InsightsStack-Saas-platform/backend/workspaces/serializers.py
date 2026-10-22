from rest_framework import serializers
from .models import Workspace, WorkspaceMember

class WorkspaceMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = WorkspaceMember
        fields = '__all__'
        read_only_fields = ('workspace', 'added_at')

class WorkspaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = '__all__'
        read_only_fields = ('created_by', 'created_at', 'updated_at')

    def validate(self, attrs):
        organization = attrs.get('organization', getattr(self.instance, 'organization', None))
        request = self.context.get('request')
        if organization and request and not organization.members.filter(
            user=request.user,
            role='admin',
            is_active=True,
        ).exists():
            raise serializers.ValidationError({'organization': 'Organization admin access is required.'})
        return attrs
