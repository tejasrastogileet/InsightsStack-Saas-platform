from django.urls import path
from .views import UserMeView, UserListView, UserDetailView

urlpatterns = [
    path('', UserListView.as_view(), name='user-list'),
    path('me/', UserMeView.as_view(), name='user-me'),
    path('<uuid:pk>/', UserDetailView.as_view(), name='user-detail'),
]
