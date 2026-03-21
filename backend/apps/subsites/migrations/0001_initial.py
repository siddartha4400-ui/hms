# Generated manually for HMS subsite support

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("attachments", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="HMS",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("hms_name", models.CharField(db_index=True, max_length=64, unique=True)),
                (
                    "hms_type",
                    models.PositiveSmallIntegerField(
                        choices=[(1, "Lodge"), (2, "PG")],
                    ),
                ),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("hms_display_name", models.CharField(max_length=120)),
                ("about_hms", models.TextField(blank=True, default="")),
                ("mobile_number", models.CharField(blank=True, default="", max_length=20)),
                ("time_period", models.PositiveIntegerField(default=12)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "auth_user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.PROTECT,
                        related_name="owned_hms_sites",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "created_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="created_hms_records",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "logo_attachment",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="hms_logos",
                        to="attachments.attachment",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_hms_records",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "hms",
                "ordering": ["-created_at"],
            },
        ),
    ]
