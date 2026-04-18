from django.conf import settings
from django.contrib.auth import authenticate
from django.shortcuts import render
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework_simplejwt.views import TokenRefreshView

from .models import Activity
from .pagination import ActivityPagination
from .serializers import ActivitySerializer, UserRegisterSerializer

REFRESH_COOKIE_NAME = 'refresh_token'


def set_refresh_cookie(response, token_value):
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token_value,
        httponly=True,
        secure=not settings.DEBUG,
        samesite='Lax',
        max_age=24 * 60 * 60,
        path='/',
    )


def register_page(request):
    return render(request, 'register.html')


def login_page(request):
    return render(request, 'login.html')


def dashboard_page(request):
    return render(request, 'dashboard.html')


class RegisterAPIView(generics.CreateAPIView):
    serializer_class = UserRegisterSerializer
    permission_classes = [permissions.AllowAny]


class LoginAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response({'detail': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = authenticate(username=username, password=password)
        if not user:
            return Response({'detail': 'Invalid username or password.'}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        response = Response(
            {
                'access': str(refresh.access_token),
                'user': {'id': user.id, 'username': user.username},
            },
            status=status.HTTP_200_OK,
        )
        set_refresh_cookie(response, str(refresh))
        return response


class CookieTokenRefreshView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        request_data = request.data.copy()
        if not request_data.get('refresh'):
            refresh_cookie = request.COOKIES.get(REFRESH_COOKIE_NAME)
            if refresh_cookie:
                request_data['refresh'] = refresh_cookie

        serializer = self.get_serializer(data=request_data)
        serializer.is_valid(raise_exception=True)

        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        new_refresh = serializer.validated_data.get('refresh')
        if new_refresh:
            set_refresh_cookie(response, new_refresh)
        return response


class LogoutAPIView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = request.COOKIES.get(REFRESH_COOKIE_NAME)
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass

        response = Response({'detail': 'Logged out.'}, status=status.HTTP_200_OK)
        response.delete_cookie(REFRESH_COOKIE_NAME, path='/')
        return response


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    pagination_class = ActivityPagination

    def get_queryset(self):
        queryset = Activity.objects.filter(user=self.request.user)

        category = self.request.query_params.get('category')
        if category and category != 'All':
            queryset = queryset.filter(category=category)

        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(name__icontains=search.strip())

        sort = self.request.query_params.get('sort', 'newest')
        if sort == 'oldest':
            queryset = queryset.order_by('date', 'created_at')
        else:
            queryset = queryset.order_by('-date', '-created_at')

        return queryset

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
