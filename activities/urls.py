from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ActivityViewSet,
    CookieTokenRefreshView,
    LoginAPIView,
    LogoutAPIView,
    RegisterAPIView,
    dashboard_page,
    login_page,
    register_page,
)

router = DefaultRouter()
router.register(r'activities', ActivityViewSet, basename='activity')

urlpatterns = [
    path('', login_page, name='home'),
    path('register/', register_page, name='register-page'),
    path('login/', login_page, name='login-page'),
    path('dashboard/', dashboard_page, name='dashboard-page'),
    path('api/register/', RegisterAPIView.as_view(), name='register'),
    path('api/login/', LoginAPIView.as_view(), name='login'),
    path('api/logout/', LogoutAPIView.as_view(), name='logout'),
    path('api/token/refresh/', CookieTokenRefreshView.as_view(), name='token-refresh'),
    path('api/', include(router.urls)),
]
