from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="booking",
            name="payment_method",
            field=models.CharField(
                choices=[("manual_booking", "Manual Booking")],
                default="manual_booking",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="booking",
            name="status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending Approval"),
                    ("confirmed", "Confirmed"),
                    ("rejected", "Rejected"),
                    ("cancelled", "Cancelled"),
                    ("completed", "Completed"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]