from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from django.utils.text import slugify
from rest_framework import serializers

from organizations.models import Organization, OrganizationMember
from users.models import User, UserProfile
from workspaces.models import Workspace, WorkspaceMember


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ('email', 'password', 'first_name', 'last_name')

    def create(self, validated_data):
        with transaction.atomic():
            user = User.objects.create_user(
                email=validated_data['email'],
                password=validated_data['password'],
                first_name=validated_data.get('first_name', ''),
                last_name=validated_data.get('last_name', ''),
            )
            UserProfile.objects.create(user=user, role='admin')

            organization_name = f"{user.first_name or user.email.split('@')[0]}'s Workspace"
            organization_slug = f"{slugify(organization_name)[:220]}-{str(user.id)[:8]}"
            organization = Organization.objects.create(
                name=organization_name,
                slug=organization_slug,
                owner=user,
            )
            OrganizationMember.objects.create(
                organization=organization,
                user=user,
                role='admin',
            )
            workspace = Workspace.objects.create(
                organization=organization,
                name='Default Workspace',
                slug='default',
                created_by=user,
                is_default=True,
            )
            WorkspaceMember.objects.create(
                workspace=workspace,
                user=user,
                role='admin',
            )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    mfa_code = serializers.CharField(required=False, allow_blank=True, max_length=6)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)


class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])


class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)


class MFASetupSerializer(serializers.Serializer):
    pass


class MFAVerifySerializer(serializers.Serializer):
    code = serializers.CharField(required=True, max_length=6)
