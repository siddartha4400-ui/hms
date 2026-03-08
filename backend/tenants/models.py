from django.db import models
from django_tenants.models import TenantMixin, DomainMixin


class Tenant(TenantMixin):
    name = models.CharField(max_length=255)
    subdomain = models.SlugField(max_length=100, unique=True)
    is_active = models.BooleanField(default=True)
    paid_until = models.DateField(null=True, blank=True)
    on_trial = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # default auto fields from TenantMixin include schema_name
    def __str__(self):
        return self.name


class Domain(DomainMixin):
    # domain is linked to Tenant via ForeignKey by DomainMixin
    pass
