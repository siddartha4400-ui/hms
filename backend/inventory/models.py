from django.db import models

class Location(models.Model):
    # tenant schema will contain this model as part of tenant apps
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Building(models.Model):
    location = models.ForeignKey(Location, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.name} - {self.location.name}"

class Floor(models.Model):
    building = models.ForeignKey(Building, on_delete=models.CASCADE)
    number = models.IntegerField()

    class Meta:
        unique_together = ("building", "number")

    def __str__(self):
        return f"Floor {self.number} - {self.building.name}"

class Room(models.Model):
    STATUS_CHOICES = ("available", "Available"), ("booked", "Booked"), ("maintenance", "Maintenance")
    building = models.ForeignKey(Building, on_delete=models.CASCADE)
    floor = models.ForeignKey(Floor, on_delete=models.CASCADE)
    number = models.CharField(max_length=50)
    room_type = models.CharField(max_length=100, blank=True)
    capacity = models.PositiveIntegerField(default=1)
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="available")

    class Meta:
        unique_together = ("building", "number")

    def __str__(self):
        return f"Room {self.number} - {self.building.name}"
