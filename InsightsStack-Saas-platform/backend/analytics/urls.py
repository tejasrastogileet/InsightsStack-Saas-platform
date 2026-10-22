from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DatasetSummaryView, KPIViewSet, RevenueView, CustomerGrowthView, TrendAnalysisView, ConversionRateView

router = DefaultRouter()
router.register(r'kpis', KPIViewSet, basename='kpi')

urlpatterns = [
    path('', include(router.urls)),
    path('revenue/', RevenueView.as_view(), name='revenue'),
    path('customer-growth/', CustomerGrowthView.as_view(), name='customer-growth'),
    path('trends/', TrendAnalysisView.as_view(), name='trends'),
    path('conversion-rate/', ConversionRateView.as_view(), name='conversion-rate'),
    path('datasets/summary/', DatasetSummaryView.as_view(), name='dataset-summary'),
]
