import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer


class BookingConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.group_name = "bookings"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content):
        await self.channel_layer.group_send(
            self.group_name,
            {
                "type": "booking_update",
                "data": content,
            },
        )

    async def booking_update(self, event):
        await self.send_json(event["data"])


class DashboardConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.group_name = "dashboard"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def stats_update(self, event):
        await self.send_json(event["data"])
