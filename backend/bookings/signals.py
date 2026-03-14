from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from .models import Booking


@receiver(post_save, sender=Booking)
def booking_changed(sender, instance, created, **kwargs):
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return

    data = {
        "type": "booking_update",
        "data": {
            "action": "created" if created else "updated",
            "booking_id": instance.id,
            "status": instance.status,
            "room_id": instance.room_id,
            "guest_id": instance.guest_id,
        },
    }

    async_to_sync(channel_layer.group_send)("bookings", data)
    async_to_sync(channel_layer.group_send)("dashboard", {
        "type": "stats_update",
        "data": {"refresh": True},
    })
