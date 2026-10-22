from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkspaceViewSet, WorkspaceMemberViewSet

router = DefaultRouter()
router.register(r'', WorkspaceViewSet, basename='workspace')

urlpatterns = [
    path('', include(router.urls)),
    path('<uuid:workspace_pk>/members/', WorkspaceMemberViewSet.as_view({'get': 'list', 'post': 'create'}), name='workspace-members-list'),
    path('<uuid:workspace_pk>/members/<int:pk>/', WorkspaceMemberViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}), name='workspace-members-detail'),
]
