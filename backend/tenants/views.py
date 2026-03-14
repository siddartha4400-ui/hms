from rest_framework import viewsets
from .models import Tenant
from .serializers import TenantSerializer


class TenantViewSet(viewsets.ModelViewSet):
    """API endpoint for Tenant management."""
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    search_fields = ["name", "subdomain"]
    filterset_fields = ["is_active", "on_trial"]
