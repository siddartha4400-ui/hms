from django.test import TestCase
from .models import Location, Building, Floor, Room


class InventoryModelTest(TestCase):
    def setUp(self):
        self.location = Location.objects.create(
            name="Downtown Hotel", address="123 Main St"
        )
        self.building = Building.objects.create(
            location=self.location, name="Main Building"
        )
        self.floor = Floor.objects.create(building=self.building, number=1)

    def test_location_str(self):
        self.assertEqual(str(self.location), "Downtown Hotel")

    def test_building_str(self):
        self.assertEqual(str(self.building), "Main Building - Downtown Hotel")

    def test_floor_str(self):
        self.assertEqual(str(self.floor), "Floor 1 - Main Building")

    def test_create_room(self):
        room = Room.objects.create(
            building=self.building,
            floor=self.floor,
            number="101",
            room_type="Standard",
            capacity=2,
            base_price=99.99,
        )
        self.assertEqual(room.status, "available")
        self.assertEqual(str(room), "Room 101 - Main Building")

    def test_room_unique_together(self):
        Room.objects.create(
            building=self.building,
            floor=self.floor,
            number="101",
            base_price=99.99,
        )
        with self.assertRaises(Exception):
            Room.objects.create(
                building=self.building,
                floor=self.floor,
                number="101",
                base_price=149.99,
            )

    def test_floor_unique_together(self):
        with self.assertRaises(Exception):
            Floor.objects.create(building=self.building, number=1)
