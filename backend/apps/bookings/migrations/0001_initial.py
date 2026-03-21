from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("attachments", "0001_initial"),
        ("propertys", "0001_initial"),
        ("subsites", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Booking",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("booking_reference", models.CharField(db_index=True, max_length=24, unique=True)),
                ("inventory_type", models.CharField(choices=[("room", "Room"), ("bed", "Bed")], max_length=10)),
                ("status", models.CharField(choices=[("confirmed", "Confirmed"), ("cancelled", "Cancelled"), ("completed", "Completed")], default="confirmed", max_length=20)),
                ("payment_method", models.CharField(choices=[("cod", "Cash On Delivery")], default="cod", max_length=20)),
                ("guest_count", models.PositiveIntegerField(default=1)),
                ("check_in", models.DateField()),
                ("check_out", models.DateField()),
                ("total_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("special_request", models.TextField(blank=True, default="")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("bed", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="bookings", to="propertys.bed")),
                ("booked_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_bookings", to=settings.AUTH_USER_MODEL)),
                ("building", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="bookings", to="propertys.building")),
                ("city", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="bookings", to="propertys.city")),
                ("hms", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="bookings", to="subsites.hms")),
                ("room", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="bookings", to="propertys.room")),
            ],
            options={
                "db_table": "bookings",
                "ordering": ["-created_at"],
                "indexes": [
                    models.Index(fields=["status"], name="bookings_st_status_57999f_idx"),
                    models.Index(fields=["check_in", "check_out"], name="bookings_ch_check_i_5e6d1b_idx"),
                    models.Index(fields=["inventory_type"], name="bookings_in_invento_c032aa_idx"),
                ],
            },
        ),
        migrations.CreateModel(
            name="BookingGuest",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("full_name", models.CharField(max_length=140)),
                ("mobile_number", models.CharField(blank=True, default="", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("aadhaar_attachment", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="booking_guests", to="attachments.attachment")),
                ("booking", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="guests", to="bookings.booking")),
            ],
            options={
                "db_table": "booking_guests",
                "ordering": ["id"],
            },
        ),
    ]