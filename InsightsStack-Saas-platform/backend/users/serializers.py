from rest_framework import serializers
from .models import User, UserProfile

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['role', 'phone', 'timezone', 'language', 'mfa_enabled', 'theme', 'notifications_email', 'updated_at']
        read_only_fields = ['mfa_enabled', 'updated_at']

class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'full_name', 'is_active', 'is_email_verified', 'avatar', 'created_at', 'updated_at', 'profile']
        read_only_fields = ['id', 'email', 'is_active', 'is_email_verified', 'created_at', 'updated_at', 'full_name']

class UserUpdateSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(required=False)
    
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'avatar', 'profile']

    def validate_avatar(self, avatar):
        if avatar.size > 2 * 1024 * 1024:
            raise serializers.ValidationError('Profile photos must be 2 MB or smaller.')
        return avatar
        
    def update(self, instance, validated_data):
        profile_data = validated_data.pop('profile', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if profile_data and hasattr(instance, 'profile'):
            for attr, value in profile_data.items():
                setattr(instance.profile, attr, value)
            instance.profile.save()
            
        return instance
