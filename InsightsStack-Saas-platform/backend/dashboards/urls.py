from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DashboardViewSet, WidgetViewSet

router = DefaultRouter()
router.register(r'widgets', WidgetViewSet, basename='widget')
router.register(r'', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]
