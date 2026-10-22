from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AIConversationViewSet, AIQueryView, AIInsightsView

router = DefaultRouter()
router.register(r'conversations', AIConversationViewSet, basename='ai-conversation')

urlpatterns = [
    path('', include(router.urls)),
    path('query/', AIQueryView.as_view(), name='ai-query'),
    path('insights/', AIInsightsView.as_view(), name='ai-insights'),
]
