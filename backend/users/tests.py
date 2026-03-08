from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()


class UserModelTest(TestCase):
    def test_create_user(self):
        user = User.objects.create_user(
            username="testuser", password="testpass123", role="staff"
        )
        self.assertEqual(user.username, "testuser")
        self.assertEqual(user.role, "staff")
        self.assertTrue(user.is_active)
        self.assertTrue(user.check_password("testpass123"))

    def test_create_admin_user(self):
        user = User.objects.create_user(
            username="admin", password="adminpass", role="admin"
        )
        self.assertEqual(user.role, "admin")

    def test_default_role_is_guest(self):
        user = User.objects.create_user(username="guest", password="guestpass")
        self.assertEqual(user.role, "guest")

    def test_user_str(self):
        user = User.objects.create_user(
            username="john", password="pass123", role="manager"
        )
        self.assertEqual(str(user), "john (manager)")
