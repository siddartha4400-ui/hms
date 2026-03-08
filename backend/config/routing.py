from django.urls import re_path
from bookings.consumers import BookingConsumer, DashboardConsumer

websocket_urlpatterns = [
    re_path(r"ws/bookings/$", BookingConsumer.as_asgi()),
    re_path(r"ws/dashboard/$", DashboardConsumer.as_asgi()),
]
