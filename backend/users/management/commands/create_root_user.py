from getpass import getpass

from django.contrib.auth.models import Group, User as DjangoUser
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from apps.users.models import User as UserProfile
from apps.users.permissions import ROOT_ADMIN_GROUP


class Command(BaseCommand):
    help = "Create or promote a root admin user from terminal"

    def add_arguments(self, parser):
        parser.add_argument("--email", required=True, help="Root admin email")
        parser.add_argument("--password", help="Root admin password (omit to enter securely)")
        parser.add_argument("--mobile", default="9999999999", help="Mobile number for user profile")
        parser.add_argument("--first-name", default="Root", help="First name")
        parser.add_argument("--last-name", default="Admin", help="Last name")
        parser.add_argument("--hms-id", type=int, default=1, help="hms_id for profile row")

    @transaction.atomic
    def handle(self, *args, **options):
        email = (options["email"] or "").strip().lower()
        password = options.get("password")
        mobile = (options.get("mobile") or "").strip()
        first_name = (options.get("first_name") or "Root").strip()
        last_name = (options.get("last_name") or "Admin").strip()
        hms_id = options.get("hms_id") or 1

        if not email:
            raise CommandError("--email is required")

        if not password:
            password = getpass("Enter password for root user: ")
            confirm = getpass("Confirm password: ")
            if password != confirm:
                raise CommandError("Passwords do not match")

        if len(password) < 6:
            raise CommandError("Password must be at least 6 characters")

        group = Group.objects.filter(name=ROOT_ADMIN_GROUP).first()
        if not group:
            raise CommandError(
                f"Group '{ROOT_ADMIN_GROUP}' not found. Run: python manage.py setup_groups"
            )

        django_user = DjangoUser.objects.filter(email=email).first()
        created_auth = False

        if django_user:
            django_user.username = email
            django_user.first_name = first_name
            django_user.last_name = last_name
            django_user.is_active = True
            django_user.is_staff = True
            django_user.is_superuser = True
            django_user.set_password(password)
            django_user.save()
        else:
            django_user = DjangoUser.objects.create_user(
                username=email,
                email=email,
                first_name=first_name,
                last_name=last_name,
                password=password,
                is_active=True,
                is_staff=True,
                is_superuser=True,
            )
            created_auth = True

        # Keep only root_admin group for this user.
        django_user.groups.clear()
        django_user.groups.add(group)

        profile = UserProfile.objects.filter(auth_user=django_user).first()
        created_profile = False

        if profile:
            if profile.mobile_number != mobile and UserProfile.objects.filter(mobile_number=mobile).exclude(
                auth_user=django_user
            ).exists():
                raise CommandError(
                    f"Mobile number '{mobile}' is already used by another user profile"
                )
            profile.mobile_number = mobile
            profile.role = 2
            profile.hms_id = hms_id
            profile.is_active = True
            profile.is_verified = True
            profile.save()
        else:
            if UserProfile.objects.filter(mobile_number=mobile).exists():
                raise CommandError(
                    f"Mobile number '{mobile}' is already used. Pass a unique --mobile value."
                )
            profile = UserProfile.objects.create(
                auth_user=django_user,
                mobile_number=mobile,
                role=2,
                hms_id=hms_id,
                is_active=True,
                is_verified=True,
            )
            created_profile = True

        action = "created" if created_auth else "updated"
        profile_action = "created" if created_profile else "updated"

        self.stdout.write(self.style.SUCCESS("Root user setup successful."))
        self.stdout.write(f"- Auth user {action}: id={django_user.id}, email={django_user.email}")
        self.stdout.write(f"- Profile {profile_action}: id={profile.id}, mobile={profile.mobile_number}")
        self.stdout.write(f"- Group assigned: {ROOT_ADMIN_GROUP}")
        self.stdout.write("- Flags: is_superuser=True, is_staff=True, role=2")
