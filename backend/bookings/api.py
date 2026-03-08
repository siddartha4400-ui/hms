from rest_framework import viewsets, serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    guest_username = serializers.CharField(source='guest.username', read_only=True)
    room_number = serializers.CharField(source='room.number', read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'guest', 'guest_username', 'room', 'room_number', 'check_in', 'check_out', 'status', 'total_price', 'notes', 'created_at']
        read_only_fields = ['id', 'created_at']


class BookingViewSet(viewsets.ModelViewSet):
    """API endpoint for Booking management."""
    queryset = Booking.objects.select_related('guest', 'room').all()
    serializer_class = BookingSerializer
    filterset_fields = ['status', 'guest', 'room']
    search_fields = ['guest__username', 'room__number']
    ordering_fields = ['check_in', 'created_at']
