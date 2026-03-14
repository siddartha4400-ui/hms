from rest_framework import serializers
from .models import Location, Building, Floor, Room


class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = "__all__"


class BuildingSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source="location.name", read_only=True)

    class Meta:
        model = Building
        fields = ["id", "location", "location_name", "name"]


class FloorSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source="building.name", read_only=True)

    class Meta:
        model = Floor
        fields = ["id", "building", "building_name", "number"]


class RoomSerializer(serializers.ModelSerializer):
    building_name = serializers.CharField(source="building.name", read_only=True)
    floor_number = serializers.IntegerField(source="floor.number", read_only=True)

    class Meta:
        model = Room
        fields = [
            "id", "building", "building_name", "floor", "floor_number",
            "number", "room_type", "capacity", "base_price", "status",
        ]
