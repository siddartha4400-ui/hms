from rest_framework import viewsets
from .models import Location, Building, Floor, Room
from .serializers import (
    LocationSerializer, BuildingSerializer,
    FloorSerializer, RoomSerializer,
)


class LocationViewSet(viewsets.ModelViewSet):
    """API endpoint for Location management."""
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    search_fields = ["name"]


class BuildingViewSet(viewsets.ModelViewSet):
    """API endpoint for Building management."""
    queryset = Building.objects.select_related("location").all()
    serializer_class = BuildingSerializer
    filterset_fields = ["location"]
    search_fields = ["name"]


class FloorViewSet(viewsets.ModelViewSet):
    """API endpoint for Floor management."""
    queryset = Floor.objects.select_related("building").all()
    serializer_class = FloorSerializer
    filterset_fields = ["building"]


class RoomViewSet(viewsets.ModelViewSet):
    """API endpoint for Room management."""
    queryset = Room.objects.select_related("building", "floor").all()
    serializer_class = RoomSerializer
    filterset_fields = ["status", "building", "floor"]
    search_fields = ["number", "room_type"]
