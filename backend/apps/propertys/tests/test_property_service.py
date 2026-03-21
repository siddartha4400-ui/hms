from django.contrib.auth.models import User
from django.test import TestCase

from apps.propertys.services import PropertyService
from apps.subsites.models import HMS
from common.exceptions import ApiException


class PropertyServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="tester", email="tester@example.com", password="pass1234")
        self.pg_hms = HMS.objects.create(
            hms_name="testpg",
            hms_type=2,
            is_active=True,
            hms_display_name="Test PG",
            auth_user=self.user,
            created_by=self.user,
            updated_by=self.user,
        )
        self.lodge_hms = HMS.objects.create(
            hms_name="testlodge",
            hms_type=1,
            is_active=True,
            hms_display_name="Test Lodge",
            auth_user=self.user,
            created_by=self.user,
            updated_by=self.user,
        )

        self.city = PropertyService.create_city(
            {"city_name": "Chennai", "state": "TN", "country": "India", "is_active": True},
            actor=self.user,
        )

    def _create_building(self, company_id, property_type):
        return PropertyService.create_building(
            {
                "company_id": company_id,
                "city_id": self.city["id"],
                "name": f"B-{property_type}-{company_id}",
                "location": "Main Road",
                "property_type": property_type,
                "is_active": True,
            },
            actor=self.user,
        )

    def _create_floor(self, building_id):
        return PropertyService.create_floor(
            {
                "building_id": building_id,
                "floor_number": 1,
                "description": "First floor",
                "is_active": True,
            },
            actor=self.user,
        )

    def test_pg_room_status_forced_available(self):
        building = self._create_building(self.pg_hms.id, "pg")
        floor = self._create_floor(building["id"])

        room = PropertyService.create_room(
            {
                "building_id": building["id"],
                "floor_id": floor["id"],
                "room_number": "101",
                "room_type": "single",
                "status": "occupied",
                "capacity": 2,
                "is_active": True,
            },
            actor=self.user,
        )

        self.assertEqual(room["status"], "available")
        self.assertEqual(room["bed_count"], 2)

    def test_disable_pg_room_with_occupied_bed_fails(self):
        building = self._create_building(self.pg_hms.id, "pg")
        floor = self._create_floor(building["id"])

        room = PropertyService.create_room(
            {
                "building_id": building["id"],
                "floor_id": floor["id"],
                "room_number": "102",
                "room_type": "single",
                "capacity": 2,
                "is_active": True,
            },
            actor=self.user,
        )

        beds = PropertyService.list_beds(room_id=room["id"], is_active=True)
        PropertyService.update_bed(beds[0]["id"], {"status": "occupied"}, actor=self.user)

        with self.assertRaises(ApiException):
            PropertyService.update_room(room["id"], {"is_active": False}, actor=self.user)

    def test_disable_city_with_active_building_fails(self):
        self._create_building(self.lodge_hms.id, "lodge")

        with self.assertRaises(ApiException):
            PropertyService.update_city(self.city["id"], {"is_active": False}, actor=self.user)
