from django.contrib.auth.models import Group, User as DjangoUser
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.attachments.models import Attachment
from apps.bookings.models import Booking, BookingGuest
from apps.propertys.models import Bed, Building, City, Floor, Room
from apps.subsites.models import HMS
from apps.users.models import OTP, PasswordResetToken, User as UserProfile
from apps.users.permissions import ROOT_ADMIN_GROUP


class Command(BaseCommand):
    help = "Delete HMS business data to start fresh (optionally preserving root admin users)"

    def add_arguments(self, parser):
        parser.add_argument(
            "--keep-root-email",
            action="append",
            default=[],
            help="Email of root user to preserve. Repeat flag to preserve multiple.",
        )
        parser.add_argument(
            "--include-users",
            action="store_true",
            help="Also delete non-root auth users and user profiles",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what will be deleted without actually deleting",
        )
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Skip interactive confirmation",
        )

    def handle(self, *args, **options):
        include_users = options.get("include_users", False)
        dry_run = options.get("dry_run", False)
        skip_confirm = options.get("yes", False)

        keep_emails = {
            (email or "").strip().lower()
            for email in options.get("keep_root_email", [])
            if (email or "").strip()
        }

        root_group = Group.objects.filter(name=ROOT_ADMIN_GROUP).first()
        root_group_user_ids = set()
        if root_group:
            root_group_user_ids = set(root_group.user_set.values_list("id", flat=True))

        explicit_keep_user_ids = set(
            DjangoUser.objects.filter(email__in=keep_emails).values_list("id", flat=True)
        )

        preserve_user_ids = root_group_user_ids | explicit_keep_user_ids

        counts = {
            "booking_guests": BookingGuest.objects.count(),
            "bookings": Booking.objects.count(),
            "beds": Bed.objects.count(),
            "rooms": Room.objects.count(),
            "floors": Floor.objects.count(),
            "buildings": Building.objects.count(),
            "cities": City.objects.count(),
            "hms": HMS.objects.count(),
            "attachments": Attachment.objects.count(),
            "otps": OTP.objects.count(),
            "password_reset_tokens": PasswordResetToken.objects.count(),
        }

        if include_users:
            counts["user_profiles_to_delete"] = UserProfile.objects.exclude(
                auth_user_id__in=preserve_user_ids
            ).count()
            counts["auth_users_to_delete"] = DjangoUser.objects.exclude(
                id__in=preserve_user_ids
            ).count()

        self.stdout.write(self.style.WARNING("This will remove HMS data with the following counts:"))
        for key, value in counts.items():
            self.stdout.write(f"- {key}: {value}")

        self.stdout.write(
            f"- preserved_auth_users: {len(preserve_user_ids)} "
            f"(root_admin group + --keep-root-email)"
        )

        if dry_run:
            self.stdout.write(self.style.SUCCESS("Dry run complete. No data deleted."))
            return

        if not skip_confirm:
            confirm = input("Type RESET to continue: ").strip()
            if confirm != "RESET":
                self.stdout.write(self.style.ERROR("Aborted by user."))
                return

        with transaction.atomic():
            # Delete in dependency-safe order.
            BookingGuest.objects.all().delete()
            Booking.objects.all().delete()
            Bed.objects.all().delete()
            Room.objects.all().delete()
            Floor.objects.all().delete()
            Building.objects.all().delete()
            City.objects.all().delete()
            HMS.objects.all().delete()
            Attachment.objects.all().delete()
            OTP.objects.all().delete()
            PasswordResetToken.objects.all().delete()

            if include_users:
                UserProfile.objects.exclude(auth_user_id__in=preserve_user_ids).delete()
                DjangoUser.objects.exclude(id__in=preserve_user_ids).delete()

        self.stdout.write(self.style.SUCCESS("HMS reset complete."))
        self.stdout.write("Use --dry-run first whenever running in production-like environments.")
