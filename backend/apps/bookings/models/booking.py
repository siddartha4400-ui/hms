from django.contrib.auth.models import User as DjangoUser
from django.db import models

from apps.attachments.models import Attachment
from apps.propertys.models import Bed, Building, City, Room
from apps.subsites.models import HMS


BOOKING_STATUS_CHOICES = [
	("confirmed", "Confirmed"),
	("cancelled", "Cancelled"),
	("completed", "Completed"),
]

PAYMENT_METHOD_CHOICES = [
	("cod", "Cash On Delivery"),
]

INVENTORY_TYPE_CHOICES = [
	("room", "Room"),
	("bed", "Bed"),
]


class Booking(models.Model):
	booking_reference = models.CharField(max_length=24, unique=True, db_index=True)
	hms = models.ForeignKey(HMS, on_delete=models.PROTECT, related_name="bookings")
	city = models.ForeignKey(City, on_delete=models.PROTECT, related_name="bookings")
	building = models.ForeignKey(Building, on_delete=models.PROTECT, related_name="bookings")
	room = models.ForeignKey(Room, on_delete=models.PROTECT, null=True, blank=True, related_name="bookings")
	bed = models.ForeignKey(Bed, on_delete=models.PROTECT, null=True, blank=True, related_name="bookings")
	booked_by = models.ForeignKey(
		DjangoUser,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="property_bookings",
	)
	inventory_type = models.CharField(max_length=10, choices=INVENTORY_TYPE_CHOICES)
	status = models.CharField(max_length=20, choices=BOOKING_STATUS_CHOICES, default="confirmed")
	payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default="cod")
	guest_count = models.PositiveIntegerField(default=1)
	check_in = models.DateField()
	check_out = models.DateField()
	total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
	special_request = models.TextField(blank=True, default="")
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = "bookings"
		ordering = ["-created_at"]
		indexes = [
			models.Index(fields=["status"]),
			models.Index(fields=["check_in", "check_out"]),
			models.Index(fields=["inventory_type"]),
		]

	def __str__(self):
		return self.booking_reference


class BookingGuest(models.Model):
	booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="guests")
	full_name = models.CharField(max_length=140)
	mobile_number = models.CharField(max_length=20, blank=True, default="")
	aadhaar_attachment = models.ForeignKey(
		Attachment,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name="booking_guests",
	)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	class Meta:
		db_table = "booking_guests"
		ordering = ["id"]

	def __str__(self):
		return f"{self.booking.booking_reference} - {self.full_name}"