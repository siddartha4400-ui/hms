from datetime import date, timedelta

from django.contrib.auth.models import User as DjangoUser
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase

from apps.attachments.models import Attachment
from apps.bookings.models import Booking
from apps.bookings.services.availability_service import AvailabilityService
from apps.bookings.services.booking_service import BookingService
from common.exceptions import ApiException
from apps.propertys.models import Bed, Building, City, Floor, Room
from apps.subsites.models import HMS


class BookingServiceTests(TestCase):
    def setUp(self):
        self.owner = DjangoUser.objects.create_user(username="owner", email="owner@example.com", password="secret123")
        self.customer = DjangoUser.objects.create_user(username="customer", email="customer@example.com", password="secret123")
        self.hms = HMS.objects.create(
            hms_name="samplelms",
            hms_type=1,
            is_active=True,
            hms_display_name="Sample LMS",
            auth_user=self.owner,
        )
        self.city = City.objects.create(city_name="Hyderabad", state="TS", country="India")
        self.lodge_building = Building.objects.create(
            company=self.hms,
            city=self.city,
            name="Central Lodge",
            property_type="lodge",
            location="MG Road",
        )
        self.pg_building = Building.objects.create(
            company=self.hms,
            city=self.city,
            name="Central PG",
            property_type="pg",
            location="MG Road",
        )
        self.lodge_floor = Floor.objects.create(building=self.lodge_building, floor_number=1)
        self.pg_floor = Floor.objects.create(building=self.pg_building, floor_number=1)
        self.lodge_room = Room.objects.create(
            building=self.lodge_building,
            floor=self.lodge_floor,
            room_number="101",
            room_type="double",
            price_per_day=1200,
            status="available",
            capacity=2,
        )
        self.lodge_room_ac = Room.objects.create(
            building=self.lodge_building,
            floor=self.lodge_floor,
            room_number="102",
            room_type="ac",
            price_per_day=1500,
            status="available",
            capacity=2,
        )
        self.pg_room = Room.objects.create(
            building=self.pg_building,
            floor=self.pg_floor,
            room_number="PG-1",
            room_type="dorm",
            price_per_day=400,
            status="available",
            capacity=2,
        )
        self.pg_bed = Bed.objects.create(room=self.pg_room, bed_number="B1", status="available")

    def _attachment(self):
        return Attachment.objects.create(
            hms_id=self.hms.id,
            entity_type="booking_guest_aadhaar",
            entity_id=0,
            file=SimpleUploadedFile("proof.txt", b"aadhaar-proof", content_type="text/plain"),
        )

    def _create_booking(self, *, check_in, check_out, status="confirmed", booked_by=None):
        return Booking.objects.create(
            booking_reference=f"BKTEST{Booking.objects.count() + 1:04d}",
            hms=self.hms,
            city=self.city,
            building=self.lodge_building,
            room=self.lodge_room,
            inventory_type="room",
            status=status,
            payment_method="cod",
            guest_count=1,
            check_in=check_in,
            check_out=check_out,
            total_amount=1200,
            booked_by=booked_by,
        )

    def test_search_availability_returns_pg_bed_for_single_guest(self):
        options = AvailabilityService.search(
            {
                "city_id": self.city.id,
                "check_in": date.today().isoformat(),
                "check_out": (date.today() + timedelta(days=2)).isoformat(),
                "guest_count": 1,
            }
        )

        inventory_types = {item["inventory_type"] for item in options}
        self.assertIn("bed", inventory_types)
        self.assertIn("room", inventory_types)

    def test_search_availability_room_type_filter_returns_only_matching_rooms(self):
        options = AvailabilityService.search(
            {
                "city_id": self.city.id,
                "check_in": date.today().isoformat(),
                "check_out": (date.today() + timedelta(days=2)).isoformat(),
                "guest_count": 1,
                "property_type": "lodge",
                "room_type": "ac",
            }
        )

        self.assertTrue(options)
        self.assertTrue(all((item.get("room_type") or "").lower() == "ac" for item in options))

    def test_create_room_booking_marks_room_occupied(self):
        attachment = self._attachment()
        booking = BookingService.create_booking(
            {
                "inventory_type": "room",
                "room_id": self.lodge_room.id,
                "check_in": date.today().isoformat(),
                "check_out": (date.today() + timedelta(days=3)).isoformat(),
                "guest_count": 1,
                "payment_method": "cod",
                "guests": [
                    {
                        "full_name": "Guest One",
                        "mobile_number": "9999999999",
                        "aadhaar_attachment_id": attachment.id,
                    }
                ],
            },
            actor=self.customer,
        )

        self.lodge_room.refresh_from_db()
        self.assertEqual(self.lodge_room.status, "occupied")
        self.assertEqual(booking["inventory_type"], "room")
        self.assertEqual(booking["status"], "confirmed")

    def test_list_bookings_supports_tab_filters(self):
        today = date.today()
        today_booking = self._create_booking(check_in=today, check_out=today + timedelta(days=2), status="confirmed")
        ongoing_booking = self._create_booking(check_in=today - timedelta(days=2), check_out=today + timedelta(days=1), status="confirmed")
        upcoming_booking = self._create_booking(check_in=today + timedelta(days=2), check_out=today + timedelta(days=4), status="confirmed")
        old_booking = self._create_booking(check_in=today - timedelta(days=5), check_out=today - timedelta(days=1), status="confirmed")
        cancelled_booking = self._create_booking(check_in=today - timedelta(days=1), check_out=today + timedelta(days=1), status="cancelled")

        today_items = BookingService.list_bookings(view="today")
        ongoing_items = BookingService.list_bookings(view="ongoing")
        upcoming_items = BookingService.list_bookings(view="upcoming")
        old_items = BookingService.list_bookings(view="old")

        # today: check_in == today (confirmed)
        self.assertEqual({item["id"] for item in today_items}, {today_booking.id})
        # ongoing: check_in <= today AND check_out > today (confirmed) — today_booking qualifies here too
        self.assertIn(ongoing_booking.id, {item["id"] for item in ongoing_items})
        self.assertIn(today_booking.id, {item["id"] for item in ongoing_items})
        self.assertNotIn(upcoming_booking.id, {item["id"] for item in ongoing_items})
        # upcoming: check_in > today (confirmed)
        self.assertEqual({item["id"] for item in upcoming_items}, {upcoming_booking.id})
        # old: cancelled or past check_out
        self.assertEqual({item["id"] for item in old_items}, {old_booking.id, cancelled_booking.id})

    def test_list_bookings_mine_requires_login(self):
        with self.assertRaises(ApiException) as error:
            BookingService.list_bookings(view="upcoming", mine=True, actor=None)
        self.assertEqual(error.exception.status_code, 401)

    def test_list_bookings_mine_filters_to_actor(self):
        today = date.today()
        self._create_booking(
            check_in=today + timedelta(days=1),
            check_out=today + timedelta(days=2),
            status="confirmed",
            booked_by=self.customer,
        )
        self._create_booking(
            check_in=today + timedelta(days=1),
            check_out=today + timedelta(days=2),
            status="confirmed",
            booked_by=self.owner,
        )

        mine_items = BookingService.list_bookings(view="upcoming", mine=True, actor=self.customer)
        self.assertEqual(len(mine_items), 1)
        self.assertTrue(mine_items[0]["created_at_utc"].endswith("+00:00"))