from rest_framework import serializers
from .models import Guest, Booking


class GuestSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guest
        fields = ["id", "name", "email", "phone", "verified", "created_at"]
        read_only_fields = ["id", "created_at"]


class BookingSerializer(serializers.ModelSerializer):
    guest_name = serializers.CharField(source="guest.name", read_only=True)
    room_number = serializers.CharField(source="room.number", read_only=True)

    class Meta:
        model = Booking
        fields = [
            "id", "guest", "guest_name", "room", "room_number",
            "check_in", "check_out", "status", "total_price",
            "notes", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
