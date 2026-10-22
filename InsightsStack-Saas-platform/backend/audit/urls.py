from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, ActivityLogViewSet

router = DefaultRouter()
router.register(r'activities', ActivityLogViewSet, basename='activity-log')
router.register(r'', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('', include(router.urls)),
]
