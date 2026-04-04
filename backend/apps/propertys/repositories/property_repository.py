from apps.propertys.models import Bed, Building, City, Floor, Room


class PropertyRepository:
    @staticmethod
    def list_cities(is_active=None):
        queryset = City.objects.all()
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        return queryset.order_by("city_name")

    @staticmethod
    def get_city(city_id: int):
        return City.objects.filter(id=city_id).first()

    @staticmethod
    def create_city(**kwargs):
        return City.objects.create(**kwargs)

    @staticmethod
    def update_city(city, **kwargs):
        for key, value in kwargs.items():
            setattr(city, key, value)
        city.save()
        return city

    @staticmethod
    def delete_city(city):
        city.delete()

    @staticmethod
    def list_buildings(company_id=None, city_id=None, is_active=None):
        queryset = Building.objects.select_related(
            "company",
            "city",
            "building_image_attachment",
            "floor_image_attachment",
            "room_image_attachment",
            "bathroom_image_attachment",
        )
        if company_id is not None:
            queryset = queryset.filter(company_id=company_id)
        if city_id is not None:
            queryset = queryset.filter(city_id=city_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        return queryset.order_by("id")

    @staticmethod
    def get_building(building_id: int):
        return Building.objects.filter(id=building_id).select_related(
            "company",
            "city",
            "building_image_attachment",
            "floor_image_attachment",
            "room_image_attachment",
            "bathroom_image_attachment",
        ).first()

    @staticmethod
    def create_building(**kwargs):
        return Building.objects.create(**kwargs)

    @staticmethod
    def update_building(building, **kwargs):
        for key, value in kwargs.items():
            setattr(building, key, value)
        building.save()
        return building

    @staticmethod
    def delete_building(building):
        building.delete()

    @staticmethod
    def list_floors(building_id=None, is_active=None):
        queryset = Floor.objects.select_related("building")
        if building_id is not None:
            queryset = queryset.filter(building_id=building_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        return queryset.order_by("floor_number", "id")

    @staticmethod
    def get_floor(floor_id: int):
        return Floor.objects.filter(id=floor_id).select_related("building").first()

    @staticmethod
    def create_floor(**kwargs):
        return Floor.objects.create(**kwargs)

    @staticmethod
    def update_floor(floor, **kwargs):
        for key, value in kwargs.items():
            setattr(floor, key, value)
        floor.save()
        return floor

    @staticmethod
    def delete_floor(floor):
        floor.delete()

    @staticmethod
    def list_rooms(building_id=None, floor_id=None, is_active=None):
        queryset = Room.objects.select_related("building", "floor")
        if building_id is not None:
            queryset = queryset.filter(building_id=building_id)
        if floor_id is not None:
            queryset = queryset.filter(floor_id=floor_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        return queryset.order_by("room_number", "id")

    @staticmethod
    def get_room(room_id: int):
        return Room.objects.filter(id=room_id).select_related("building", "floor").first()

    @staticmethod
    def create_room(**kwargs):
        return Room.objects.create(**kwargs)

    @staticmethod
    def update_room(room, **kwargs):
        for key, value in kwargs.items():
            setattr(room, key, value)
        room.save()
        return room

    @staticmethod
    def delete_room(room):
        room.delete()

    @staticmethod
    def list_beds(room_id=None, is_active=None):
        queryset = Bed.objects.select_related("room")
        if room_id is not None:
            queryset = queryset.filter(room_id=room_id)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        return queryset.order_by("id")

    @staticmethod
    def get_bed(bed_id: int):
        return Bed.objects.filter(id=bed_id).select_related("room").first()

    @staticmethod
    def create_bed(**kwargs):
        return Bed.objects.create(**kwargs)

    @staticmethod
    def update_bed(bed, **kwargs):
        for key, value in kwargs.items():
            setattr(bed, key, value)
        bed.save()
        return bed

    @staticmethod
    def delete_bed(bed):
        bed.delete()
