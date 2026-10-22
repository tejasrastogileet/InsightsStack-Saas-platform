from django.urls import path
from .views import SubscriptionPlanListView, CurrentSubscriptionView, UpgradeSubscriptionView

urlpatterns = [
    path('plans/', SubscriptionPlanListView.as_view(), name='subscription-plans'),
    path('current/', CurrentSubscriptionView.as_view(), name='current-subscription'),
    path('upgrade/', UpgradeSubscriptionView.as_view(), name='upgrade-subscription'),
]
