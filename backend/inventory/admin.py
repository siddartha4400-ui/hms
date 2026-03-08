from django.contrib import admin
from .models import Location, Building, Floor, Room

admin.site.register(Location)
admin.site.register(Building)
admin.site.register(Floor)
admin.site.register(Room)
