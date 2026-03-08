from rest_framework import viewsets, serializers
from .models import Room

class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = "__all__"

class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.select_related("building", "floor").all()
    serializer_class = RoomSerializer
