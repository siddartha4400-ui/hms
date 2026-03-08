from django.http import Http404
from tenants.models import Tenant

class TenantMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        host = request.get_host().split(":")[0]
        parts = host.split(".")
        if len(parts) >= 3:
            subdomain = parts[0]
            try:
                request.tenant = Tenant.objects.get(subdomain=subdomain, is_active=True)
            except Tenant.DoesNotExist:
                raise Http404("Tenant not found")
        else:
            request.tenant = None
        return self.get_response(request)