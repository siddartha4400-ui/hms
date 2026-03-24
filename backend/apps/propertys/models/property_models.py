from django.contrib.auth.models import User as DjangoUser
from django.db import models

from apps.subsites.models import HMS


PROPERTY_TYPE_CHOICES = [
    ("pg", "PG"),
    ("lodge", "Lodge"),
]

ROOM_TYPE_CHOICES = [
    ("ac", "AC"),
    ("non_ac", "Non-AC"),
    ("single", "Single"),
    ("double", "Double"),
    ("dorm", "Dorm"),
    ("deluxe", "Deluxe"),
]

ROOM_STATUS_CHOICES = [
    ("available", "Available"),
    ("occupied", "Occupied"),
    ("maintenance", "Maintenance"),
]

BED_STATUS_CHOICES = [
    ("available", "Available"),
    ("occupied", "Occupied"),
    ("maintenance", "Under Maintenance"),
]


class City(models.Model):
    city_name = models.CharField(max_length=120, db_index=True)
    state = models.CharField(max_length=120, blank=True, default="")
    country = models.CharField(max_length=120, blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        DjangoUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="property_cities_created",
    )
    updated_by = models.ForeignKey(
        DjangoUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="property_cities_updated",
    )

    class Meta:
        db_table = "property_cities"
        ordering = ["city_name"]
        unique_together = ("city_name", "state", "country")

    def __str__(self):
        return f"{self.city_name}, {self.state}" if self.state else self.city_name


class Building(models.Model):
    company = models.ForeignKey(HMS, on_delete=models.CASCADE, related_name="buildings")
    city = models.ForeignKey(City, on_delete=models.PROTECT, related_name="buildings")
    name = models.CharField(max_length=140)
    location = models.CharField(max_length=255, blank=True, default="")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    property_type = models.CharField(max_length=20, choices=PROPERTY_TYPE_CHOICES)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        DjangoUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="property_buildings_created",
    )
    updated_by = models.ForeignKey(
        DjangoUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="property_buildings_updated",
    )

    class Meta:
        db_table = "property_buildings"
        ordering = ["id"]
        unique_together = ("company", "city", "name")

    def __str__(self):
        return self.name


class Floor(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name="floors")
    floor_number = models.IntegerField()
    description = models.CharField(max_length=255, blank=True, default="")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        DjangoUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="property_floors_created",
    )
    updated_by = models.ForeignKey(
        DjangoUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="property_floors_updated",
    )

    class Meta:
        db_table = "property_floors"
        ordering = ["floor_number", "id"]
        unique_together = ("building", "floor_number")

    def __str__(self):
        return f"{self.building.name} - Floor {self.floor_number}"


class Room(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE, related_name="rooms")
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE, related_name="rooms")
    room_number = models.CharField(max_length=60)
    room_type = models.CharField(max_length=20, choices=ROOM_TYPE_CHOICES)
    price_per_day = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    price_per_month = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=ROOM_STATUS_CHOICES, default="available")
    capacity = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        DjangoUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="property_rooms_created",
    )
    updated_by = models.ForeignKey(
        DjangoUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="property_rooms_updated",
    )

    class Meta:
        db_table = "property_rooms"
        ordering = ["room_number", "id"]
        unique_together = ("floor", "room_number")

    def __str__(self):
        return f"{self.building.name} - {self.room_number}"


class Bed(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="beds")
    bed_number = models.CharField(max_length=20)
    status = models.CharField(max_length=20, choices=BED_STATUS_CHOICES, default="available")
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        DjangoUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="property_beds_created",
    )
    updated_by = models.ForeignKey(
        DjangoUser,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="property_beds_updated",
    )

    class Meta:
        db_table = "property_beds"
        ordering = ["id"]
        unique_together = ("room", "bed_number")

    def __str__(self):
        return f"{self.room.room_number} - {self.bed_number}"
