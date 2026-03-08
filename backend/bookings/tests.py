from django.test import TestCase
from django.contrib.auth import get_user_model
from datetime import date, timedelta
from inventory.models import Location, Building, Floor, Room
from .models import Guest, Booking

User = get_user_model()


class GuestModelTest(TestCase):
    def test_create_guest(self):
        guest = Guest.objects.create(
            name="John Doe", email="john@example.com", phone="555-0100"
        )
        self.assertEqual(str(guest), "John Doe")
        self.assertFalse(guest.verified)

    def test_guest_email_unique(self):
        Guest.objects.create(name="John", email="john@example.com")
        with self.assertRaises(Exception):
            Guest.objects.create(name="Jane", email="john@example.com")


class BookingModelTest(TestCase):
    def setUp(self):
        location = Location.objects.create(name="Hotel")
        building = Building.objects.create(location=location, name="Main")
        floor = Floor.objects.create(building=building, number=1)
        self.room = Room.objects.create(
            building=building, floor=floor, number="101", base_price=100.00
        )
        self.guest = Guest.objects.create(
            name="John Doe", email="john@example.com"
        )

    def test_create_booking(self):
        booking = Booking.objects.create(
            guest=self.guest,
            room=self.room,
            check_in=date.today(),
            check_out=date.today() + timedelta(days=3),
            total_price=300.00,
        )
        self.assertEqual(booking.status, "pending")
        self.assertEqual(booking.total_price, 300.00)

    def test_booking_status_changes(self):
        booking = Booking.objects.create(
            guest=self.guest,
            room=self.room,
            check_in=date.today(),
            check_out=date.today() + timedelta(days=2),
        )
        booking.status = "confirmed"
        booking.save()
        booking.refresh_from_db()
        self.assertEqual(booking.status, "confirmed")

    def test_booking_ordering(self):
        b1 = Booking.objects.create(
            guest=self.guest,
            room=self.room,
            check_in=date.today(),
            check_out=date.today() + timedelta(days=1),
        )
        # Create another room for second booking
        location = Location.objects.first()
        building = Building.objects.first()
        floor = Floor.objects.first()
        room2 = Room.objects.create(
            building=building, floor=floor, number="102", base_price=150.00
        )
        b2 = Booking.objects.create(
            guest=self.guest,
            room=room2,
            check_in=date.today() + timedelta(days=1),
            check_out=date.today() + timedelta(days=2),
        )
        bookings = list(Booking.objects.all())
        # Ordered by -created_at, so b2 should be first
        self.assertEqual(bookings[0], b2)
        self.assertEqual(bookings[1], b1)
