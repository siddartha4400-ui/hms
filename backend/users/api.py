from rest_framework import viewsets, serializers
from .models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserViewSet(viewsets.ModelViewSet):
    """API endpoint for User management."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    filterset_fields = ['role', 'is_active']
    search_fields = ['username', 'email', 'first_name', 'last_name']
