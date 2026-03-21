import graphene

from apps.propertys.services import PropertyService


class CityType(graphene.ObjectType):
    id = graphene.Int()
    city_name = graphene.String()
    state = graphene.String()
    country = graphene.String()
    is_active = graphene.Boolean()
    created_at = graphene.String()
    updated_at = graphene.String()
    created_by = graphene.Int()
    updated_by = graphene.Int()


class BuildingType(graphene.ObjectType):
    id = graphene.Int()
    company_id = graphene.Int()
    city_id = graphene.Int()
    city_name = graphene.String()
    name = graphene.String()
    location = graphene.String()
    latitude = graphene.Float()
    longitude = graphene.Float()
    property_type = graphene.String()
    is_active = graphene.Boolean()
    created_at = graphene.String()
    updated_at = graphene.String()
    created_by = graphene.Int()
    updated_by = graphene.Int()


class FloorType(graphene.ObjectType):
    id = graphene.Int()
    building_id = graphene.Int()
    floor_number = graphene.Int()
    description = graphene.String()
    is_active = graphene.Boolean()
    created_at = graphene.String()
    updated_at = graphene.String()
    created_by = graphene.Int()
    updated_by = graphene.Int()


class RoomType(graphene.ObjectType):
    id = graphene.Int()
    building_id = graphene.Int()
    floor_id = graphene.Int()
    room_number = graphene.String()
    room_type = graphene.String()
    price_per_day = graphene.Float()
    price_per_month = graphene.Float()
    status = graphene.String()
    capacity = graphene.Int()
    bed_count = graphene.Int()
    is_active = graphene.Boolean()
    created_at = graphene.String()
    updated_at = graphene.String()
    created_by = graphene.Int()
    updated_by = graphene.Int()


class BedType(graphene.ObjectType):
    id = graphene.Int()
    room_id = graphene.Int()
    bed_number = graphene.String()
    status = graphene.String()
    is_active = graphene.Boolean()
    created_at = graphene.String()
    updated_at = graphene.String()
    created_by = graphene.Int()
    updated_by = graphene.Int()


class Query(graphene.ObjectType):
    list_cities = graphene.List(CityType, is_active=graphene.Boolean())
    list_buildings = graphene.List(
        BuildingType,
        company_id=graphene.Int(),
        city_id=graphene.Int(),
        is_active=graphene.Boolean(),
    )
    list_floors = graphene.List(FloorType, building_id=graphene.Int(), is_active=graphene.Boolean())
    list_rooms = graphene.List(
        RoomType,
        building_id=graphene.Int(),
        floor_id=graphene.Int(),
        is_active=graphene.Boolean(),
    )
    list_beds = graphene.List(BedType, room_id=graphene.Int(), is_active=graphene.Boolean())

    def resolve_list_cities(self, info, is_active=None):
        return [CityType(**item) for item in PropertyService.list_cities(is_active=is_active)]

    def resolve_list_buildings(self, info, company_id=None, city_id=None, is_active=None):
        return [
            BuildingType(**item)
            for item in PropertyService.list_buildings(company_id=company_id, city_id=city_id, is_active=is_active)
        ]

    def resolve_list_floors(self, info, building_id=None, is_active=None):
        return [FloorType(**item) for item in PropertyService.list_floors(building_id=building_id, is_active=is_active)]

    def resolve_list_rooms(self, info, building_id=None, floor_id=None, is_active=None):
        return [
            RoomType(**item)
            for item in PropertyService.list_rooms(building_id=building_id, floor_id=floor_id, is_active=is_active)
        ]

    def resolve_list_beds(self, info, room_id=None, is_active=None):
        return [BedType(**item) for item in PropertyService.list_beds(room_id=room_id, is_active=is_active)]
