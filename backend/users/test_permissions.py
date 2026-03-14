from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from graphql import GraphQLError
from users.permissions import role_required, admin_required, staff_required

User = get_user_model()


class MockInfo:
    def __init__(self, user):
        self.context = type("Context", (), {"user": user})()


class PermissionsTest(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="admin", password="pass", role="admin"
        )
        self.manager = User.objects.create_user(
            username="manager", password="pass", role="manager"
        )
        self.staff_user = User.objects.create_user(
            username="staff", password="pass", role="staff"
        )
        self.guest = User.objects.create_user(
            username="guest", password="pass", role="guest"
        )

    def test_admin_required_allows_admin(self):
        @admin_required
        def resolver(root, info):
            return "ok"

        result = resolver(None, MockInfo(self.admin))
        self.assertEqual(result, "ok")

    def test_admin_required_blocks_staff(self):
        @admin_required
        def resolver(root, info):
            return "ok"

        with self.assertRaises(GraphQLError):
            resolver(None, MockInfo(self.staff_user))

    def test_staff_required_allows_admin(self):
        @staff_required
        def resolver(root, info):
            return "ok"

        result = resolver(None, MockInfo(self.admin))
        self.assertEqual(result, "ok")

    def test_staff_required_allows_staff(self):
        @staff_required
        def resolver(root, info):
            return "ok"

        result = resolver(None, MockInfo(self.staff_user))
        self.assertEqual(result, "ok")

    def test_staff_required_blocks_guest(self):
        @staff_required
        def resolver(root, info):
            return "ok"

        with self.assertRaises(GraphQLError):
            resolver(None, MockInfo(self.guest))

    def test_role_required_blocks_unauthenticated(self):
        from django.contrib.auth.models import AnonymousUser

        @role_required(["admin"])
        def resolver(root, info):
            return "ok"

        with self.assertRaises(GraphQLError):
            resolver(None, MockInfo(AnonymousUser()))
