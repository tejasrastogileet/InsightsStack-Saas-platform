from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView as BaseTokenRefreshView
from django.contrib.auth import authenticate
import pyotp
from users.models import User
from .serializers import (
    RegisterSerializer, LoginSerializer, ChangePasswordSerializer,
    ForgotPasswordSerializer, ResetPasswordSerializer, EmailVerificationSerializer,
    MFASetupSerializer, MFAVerifySerializer
)

class RegisterView(generics.CreateAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': {'email': user.email, 'id': user.id},
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }, status=status.HTTP_201_CREATED)

class LoginView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = authenticate(email=serializer.validated_data['email'], password=serializer.validated_data['password'])
        
        if not user:
            return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)
            
        if hasattr(user, 'profile') and user.profile.mfa_enabled:
            code = serializer.validated_data.get('mfa_code')
            if not code:
                return Response({'mfa_required': True})
            if not pyotp.TOTP(user.profile.mfa_secret).verify(code):
                return Response({'error': 'Invalid MFA code'}, status=status.HTTP_401_UNAUTHORIZED)
            
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        })

class LogoutView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)

class TokenRefreshView(BaseTokenRefreshView):
    pass

class ForgotPasswordView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = ForgotPasswordSerializer
    
    def post(self, request):
        return Response(
            {'error': 'Password reset email delivery is not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

class ResetPasswordView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = ResetPasswordSerializer
    
    def post(self, request):
        return Response(
            {'error': 'Password reset is unavailable until email delivery is configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

class VerifyEmailView(generics.GenericAPIView):
    permission_classes = (permissions.AllowAny,)
    serializer_class = EmailVerificationSerializer
    
    def post(self, request):
        return Response(
            {'error': 'Email verification is not configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = ChangePasswordSerializer
    
    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data['old_password']):
            return Response({'error': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save(update_fields=['password'])
        return Response({'message': 'Password changed.'})

class MFASetupView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = MFASetupSerializer
    
    def post(self, request):
        secret = pyotp.random_base32()
        request.user.profile.mfa_secret = secret
        request.user.profile.save()
        url = pyotp.totp.TOTP(secret).provisioning_uri(name=request.user.email, issuer_name='InsightStack')
        return Response({'secret': secret, 'url': url})

class MFAVerifyView(generics.GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    serializer_class = MFAVerifySerializer
    
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        profile = request.user.profile
        if not profile.mfa_secret or not pyotp.TOTP(profile.mfa_secret).verify(serializer.validated_data['code']):
            return Response({'error': 'Invalid MFA code.'}, status=status.HTTP_400_BAD_REQUEST)
        profile.mfa_enabled = True
        profile.save(update_fields=['mfa_enabled', 'updated_at'])
        return Response({'message': 'MFA enabled.'})
