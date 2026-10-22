from rest_framework import serializers
from .models import Organization, OrganizationMember
from users.models import User

class OrganizationMemberSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    email = serializers.EmailField(write_only=True, required=False)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_name = serializers.CharField(source='user.full_name', read_only=True)

    class Meta:
        model = OrganizationMember
        fields = '__all__'
        read_only_fields = ('organization', 'invited_by')

    def validate(self, attrs):
        email = attrs.pop('email', None)
        if email:
            try:
                attrs['user'] = User.objects.get(email__iexact=email)
            except User.DoesNotExist as exc:
                raise serializers.ValidationError({'email': 'This email does not belong to an existing account.'}) from exc
        if not attrs.get('user') and self.instance:
            attrs['user'] = self.instance.user
        if not attrs.get('user'):
            raise serializers.ValidationError({'email': 'Provide an existing user account email.'})
        return attrs

class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = '__all__'
        read_only_fields = ('owner', 'is_active', 'created_at', 'updated_at')
