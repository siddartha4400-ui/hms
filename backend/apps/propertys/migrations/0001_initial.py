# Generated manually for propertys app

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("subsites", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="City",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("city_name", models.CharField(db_index=True, max_length=120)),
                ("state", models.CharField(blank=True, default="", max_length=120)),
                ("country", models.CharField(blank=True, default="", max_length=120)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_cities_created", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "updated_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_cities_updated", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"db_table": "property_cities", "ordering": ["city_name"], "unique_together": {("city_name", "state", "country")}},
        ),
        migrations.CreateModel(
            name="Building",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=140)),
                ("location", models.CharField(blank=True, default="", max_length=255)),
                ("latitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("longitude", models.DecimalField(blank=True, decimal_places=6, max_digits=9, null=True)),
                ("property_type", models.CharField(choices=[("pg", "PG"), ("lodge", "Lodge")], max_length=20)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("city", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="buildings", to="propertys.city")),
                ("company", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="buildings", to="subsites.hms")),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_buildings_created", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "updated_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_buildings_updated", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"db_table": "property_buildings", "ordering": ["id"], "unique_together": {("company", "city", "name")}},
        ),
        migrations.CreateModel(
            name="Floor",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("floor_number", models.IntegerField()),
                ("description", models.CharField(blank=True, default="", max_length=255)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("building", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="floors", to="propertys.building")),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_floors_created", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "updated_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_floors_updated", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"db_table": "property_floors", "ordering": ["floor_number", "id"], "unique_together": {("building", "floor_number")}},
        ),
        migrations.CreateModel(
            name="Room",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("room_number", models.CharField(max_length=60)),
                ("room_type", models.CharField(choices=[("single", "Single"), ("double", "Double"), ("dorm", "Dorm"), ("deluxe", "Deluxe")], max_length=20)),
                ("price_per_day", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("price_per_month", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("status", models.CharField(choices=[("available", "Available"), ("occupied", "Occupied"), ("maintenance", "Maintenance")], default="available", max_length=20)),
                ("capacity", models.PositiveIntegerField(default=0)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("building", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="rooms", to="propertys.building")),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_rooms_created", to=settings.AUTH_USER_MODEL),
                ),
                ("floor", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="rooms", to="propertys.floor")),
                (
                    "updated_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_rooms_updated", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"db_table": "property_rooms", "ordering": ["room_number", "id"], "unique_together": {("floor", "room_number")}},
        ),
        migrations.CreateModel(
            name="Bed",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("bed_number", models.CharField(max_length=20)),
                ("status", models.CharField(choices=[("available", "Available"), ("occupied", "Occupied")], default="available", max_length=20)),
                ("is_active", models.BooleanField(db_index=True, default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "created_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_beds_created", to=settings.AUTH_USER_MODEL),
                ),
                ("room", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="beds", to="propertys.room")),
                (
                    "updated_by",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="property_beds_updated", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"db_table": "property_beds", "ordering": ["id"], "unique_together": {("room", "bed_number")}},
        ),
    ]
