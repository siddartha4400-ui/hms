from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from graphene_django.views import GraphQLView
from django.views.decorators.csrf import csrf_exempt
from .schema import schema
from .views import TestEmailView

urlpatterns = [
    # Admin
    path("admin/", admin.site.urls),

    # GraphQL API (primary)
    path("graphql/", csrf_exempt(GraphQLView.as_view(graphiql=True, schema=schema))),

    # REST API (each app owns its own URLs)
    path("api/", include("tenants.urls")),
    path("api/", include("users.urls")),
    path("api/", include("inventory.urls")),
    path("api/", include("bookings.urls")),

    # Utilities
    path("api/test-email/", TestEmailView.as_view(), name="test-email"),

    # Health check
    path("", lambda request: HttpResponse("HMS - Hotel Management System")),
]
