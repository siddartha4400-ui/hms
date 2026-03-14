from rest_framework import serializers
from .models import Tenant, Domain


class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ["id", "domain", "is_primary"]


class TenantSerializer(serializers.ModelSerializer):
    domains = DomainSerializer(many=True, read_only=True)

    class Meta:
        model = Tenant
        fields = [
            "id", "name", "subdomain", "schema_name",
            "is_active", "paid_until", "on_trial", "created_at",
            "domains",
        ]
        read_only_fields = ["id", "schema_name", "created_at"]
