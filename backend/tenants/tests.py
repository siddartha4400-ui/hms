from django.test import TestCase
from .models import Tenant, Domain


class TenantModelTest(TestCase):
    def test_create_tenant(self):
        tenant = Tenant(schema_name="test", name="Test Hotel", subdomain="test")
        tenant.save()
        self.assertEqual(str(tenant), "Test Hotel")
        self.assertTrue(tenant.is_active)
        self.assertTrue(tenant.on_trial)

    def test_create_domain(self):
        tenant = Tenant(schema_name="test2", name="Test Hotel 2", subdomain="test2")
        tenant.save()
        domain = Domain.objects.create(
            domain="test2.localtest.me", tenant=tenant, is_primary=True
        )
        self.assertEqual(domain.domain, "test2.localtest.me")
        self.assertTrue(domain.is_primary)

    def test_subdomain_unique(self):
        Tenant(schema_name="unique", name="Hotel A", subdomain="unique").save()
        with self.assertRaises(Exception):
            Tenant(schema_name="unique2", name="Hotel B", subdomain="unique").save()
