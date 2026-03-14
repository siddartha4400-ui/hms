from rest_framework import viewsets
from .models import Guest, Booking
from .serializers import GuestSerializer, BookingSerializer


class GuestViewSet(viewsets.ModelViewSet):
    """API endpoint for Guest management."""
    queryset = Guest.objects.all()
    serializer_class = GuestSerializer
    search_fields = ["name", "email", "phone"]
    filterset_fields = ["verified"]


class BookingViewSet(viewsets.ModelViewSet):
    """API endpoint for Booking management."""
    queryset = Booking.objects.select_related("guest", "room").all()
    serializer_class = BookingSerializer
    filterset_fields = ["status", "guest", "room"]
    search_fields = ["guest__name", "room__number"]
    ordering_fields = ["check_in", "created_at"]
