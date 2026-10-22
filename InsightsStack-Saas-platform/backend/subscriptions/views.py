from rest_framework import viewsets, permissions, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.exceptions import PermissionDenied
from organizations.models import Organization, OrganizationMember
from .models import SubscriptionPlan
from .serializers import SubscriptionPlanSerializer, SubscriptionSerializer

class SubscriptionPlanListView(generics.ListAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = SubscriptionPlan.objects.filter(is_active=True)
    serializer_class = SubscriptionPlanSerializer

class CurrentSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        organization_id = request.query_params.get('organization')
        if not organization_id:
            return Response(
                {'error': 'An organization is required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        organization = Organization.objects.filter(
            pk=organization_id,
            members__user=request.user,
            members__is_active=True,
        ).first()
        if not organization:
            return Response({'error': 'Organization not found.'}, status=status.HTTP_404_NOT_FOUND)
        if not hasattr(organization, 'subscription'):
            return Response({'error': 'No subscription is configured for this organization.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = SubscriptionSerializer(organization.subscription)
        return Response(serializer.data)

class UpgradeSubscriptionView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        organization_id = request.data.get('organization_id')
        if not OrganizationMember.objects.filter(
            organization_id=organization_id,
            user=request.user,
            role='admin',
            is_active=True,
        ).exists():
            raise PermissionDenied('Organization admin access is required.')
        return Response(
            {'error': 'Subscription changes are unavailable until a billing provider is configured.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
