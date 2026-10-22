from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import OrganizationViewSet, OrganizationMemberViewSet

router = DefaultRouter()
router.register(r'', OrganizationViewSet, basename='organization')

urlpatterns = [
    path('', include(router.urls)),
    path('<uuid:organization_pk>/members/', OrganizationMemberViewSet.as_view({'get': 'list', 'post': 'create'}), name='organization-members-list'),
    path('<uuid:organization_pk>/members/<int:pk>/', OrganizationMemberViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='organization-members-detail'),
]
