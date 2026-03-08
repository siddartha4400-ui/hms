"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from rest_framework.routers import DefaultRouter
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from .schema import schema
from tenants.api import TenantViewSet
from inventory.api import RoomViewSet
from users.api import UserViewSet
from bookings.api import BookingViewSet

# REST API Router
router = DefaultRouter()
router.register(r'tenants', TenantViewSet, basename='tenant')
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'users', UserViewSet, basename='user')
router.register(r'bookings', BookingViewSet, basename='booking')

urlpatterns = [
    path('', lambda request: HttpResponse('Welcome to HMS - Hotel Management System')),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path("graphql/", csrf_exempt(GraphQLView.as_view(graphiql=True, schema=schema))),
]
