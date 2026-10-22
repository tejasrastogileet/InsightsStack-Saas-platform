from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReportViewSet, ScheduledReportViewSet

router = DefaultRouter()
router.register(r'schedules', ScheduledReportViewSet, basename='scheduled-report')
router.register(r'', ReportViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
]
