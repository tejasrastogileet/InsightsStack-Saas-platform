from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationViewSet, AlertViewSet

router = DefaultRouter()
router.register(r'alerts', AlertViewSet, basename='alert')
router.register(r'', NotificationViewSet, basename='notification')

urlpatterns = [
    path('', include(router.urls)),
]
