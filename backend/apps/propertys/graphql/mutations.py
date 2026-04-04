import graphene

from apps.propertys.graphql.queries import BedType, BuildingType, CityType, FloorType, RoomType
from apps.propertys.services import PropertyService
from common.exceptions import ApiException


def _require_root_admin(actor):
    if not actor or not actor.is_authenticated:
        raise ApiException("Authentication required")
    if not actor.groups.filter(name="root_admin").exists():
        raise ApiException("Only root_admin can manage cities")


class _BaseResult(graphene.ObjectType):
    success = graphene.Boolean()
    message = graphene.String()


class CreateCityMutation(graphene.Mutation):
    class Arguments:
        city_name = graphene.String(required=True)
        state = graphene.String()
        country = graphene.String()
        is_active = graphene.Boolean()

    success = graphene.Boolean()
    message = graphene.String()
    city = graphene.Field(CityType)

    @staticmethod
    def mutate(root, info, **kwargs):
        actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
        try:
            _require_root_admin(actor)
            city = PropertyService.create_city(kwargs, actor=actor)
            return CreateCityMutation(success=True, message="City created", city=CityType(**city))
        except ApiException as exc:
            return CreateCityMutation(success=False, message=str(exc), city=None)


class UpdateCityMutation(graphene.Mutation):
    class Arguments:
        city_id = graphene.Int(required=True)
        city_name = graphene.String()
        state = graphene.String()
        country = graphene.String()
        is_active = graphene.Boolean()

    success = graphene.Boolean()
    message = graphene.String()
    city = graphene.Field(CityType)

    @staticmethod
    def mutate(root, info, city_id, **kwargs):
        actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
        try:
            _require_root_admin(actor)
            city = PropertyService.update_city(city_id, kwargs, actor=actor)
            return UpdateCityMutation(success=True, message="City updated", city=CityType(**city))
        except ApiException as exc:
            return UpdateCityMutation(success=False, message=str(exc), city=None)


class DeleteCityMutation(graphene.Mutation):
    class Arguments:
        city_id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @staticmethod
    def mutate(root, info, city_id):
        actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
        try:
            _require_root_admin(actor)
            PropertyService.delete_city(city_id)
            return DeleteCityMutation(success=True, message="City deleted")
        except ApiException as exc:
            return DeleteCityMutation(success=False, message=str(exc))


class CreateBuildingMutation(graphene.Mutation):
    class Arguments:
        company_id = graphene.Int(required=True)
        city_id = graphene.Int(required=True)
        name = graphene.String(required=True)
        location = graphene.String()
        latitude = graphene.Float()
        longitude = graphene.Float()
        property_type = graphene.String(required=True)
        building_image_attachment_id = graphene.Int()
        floor_image_attachment_id = graphene.Int()
        room_image_attachment_id = graphene.Int()
        bathroom_image_attachment_id = graphene.Int()
        is_active = graphene.Boolean()

    success = graphene.Boolean()
    message = graphene.String()
    building = graphene.Field(BuildingType)

    @staticmethod
    def mutate(root, info, **kwargs):
        actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
        try:
            building = PropertyService.create_building(kwargs, actor=actor)
            return CreateBuildingMutation(success=True, message="Building created", building=BuildingType(**building))
        except ApiException as exc:
            return CreateBuildingMutation(success=False, message=str(exc), building=None)


class UpdateBuildingMutation(graphene.Mutation):
    class Arguments:
        building_id = graphene.Int(required=True)
        city_id = graphene.Int()
        name = graphene.String()
        location = graphene.String()
        latitude = graphene.Float()
        longitude = graphene.Float()
        property_type = graphene.String()
        building_image_attachment_id = graphene.Int()
        floor_image_attachment_id = graphene.Int()
        room_image_attachment_id = graphene.Int()
        bathroom_image_attachment_id = graphene.Int()
        is_active = graphene.Boolean()

    success = graphene.Boolean()
    message = graphene.String()
    building = graphene.Field(BuildingType)

    @staticmethod
    def mutate(root, info, building_id, **kwargs):
        actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
        try:
            building = PropertyService.update_building(building_id, kwargs, actor=actor)
            return UpdateBuildingMutation(success=True, message="Building updated", building=BuildingType(**building))
        except ApiException as exc:
            return UpdateBuildingMutation(success=False, message=str(exc), building=None)


class DeleteBuildingMutation(graphene.Mutation):
    class Arguments:
        building_id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @staticmethod
    def mutate(root, info, building_id):
        try:
            PropertyService.delete_building(building_id)
            return DeleteBuildingMutation(success=True, message="Building deleted")
        except ApiException as exc:
            return DeleteBuildingMutation(success=False, message=str(exc))


class CreateFloorMutation(graphene.Mutation):
    class Arguments:
        building_id = graphene.Int(required=True)
        floor_number = graphene.Int(required=True)
        description = graphene.String()
        is_active = graphene.Boolean()

    success = graphene.Boolean()
    message = graphene.String()
    floor = graphene.Field(FloorType)

    @staticmethod
    def mutate(root, info, **kwargs):
        actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
        try:
            floor = PropertyService.create_floor(kwargs, actor=actor)
            return CreateFloorMutation(success=True, message="Floor created", floor=FloorType(**floor))
        except ApiException as exc:
            return CreateFloorMutation(success=False, message=str(exc), floor=None)


class UpdateFloorMutation(graphene.Mutation):
    class Arguments:
        floor_id = graphene.Int(required=True)
        floor_number = graphene.Int()
        description = graphene.String()
        is_active = graphene.Boolean()

    success = graphene.Boolean()
    message = graphene.String()
    floor = graphene.Field(FloorType)

    @staticmethod
    def mutate(root, info, floor_id, **kwargs):
        actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
        try:
            floor = PropertyService.update_floor(floor_id, kwargs, actor=actor)
            return UpdateFloorMutation(success=True, message="Floor updated", floor=FloorType(**floor))
        except ApiException as exc:
            return UpdateFloorMutation(success=False, message=str(exc), floor=None)


class DeleteFloorMutation(graphene.Mutation):
    class Arguments:
        floor_id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @staticmethod
    def mutate(root, info, floor_id):
        try:
            PropertyService.delete_floor(floor_id)
            return DeleteFloorMutation(success=True, message="Floor deleted")
        except ApiException as exc:
            return DeleteFloorMutation(success=False, message=str(exc))


class CreateRoomMutation(graphene.Mutation):
    class Arguments:
        building_id = graphene.Int(required=True)
        floor_id = graphene.Int(required=True)
        room_number = graphene.String(required=True)
        room_type = graphene.String()
        price_per_day = graphene.Float()
        price_per_month = graphene.Float()
        status = graphene.String()
        capacity = graphene.Int()
        is_active = graphene.Boolean()

    success = graphene.Boolean()
    message = graphene.String()
    room = graphene.Field(RoomType)

    @staticmethod
    def mutate(root, info, **kwargs):
        actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
        try:
            room = PropertyService.create_room(kwargs, actor=actor)
            return CreateRoomMutation(success=True, message="Room created", room=RoomType(**room))
        except ApiException as exc:
            return CreateRoomMutation(success=False, message=str(exc), room=None)


class UpdateRoomMutation(graphene.Mutation):
    class Arguments:
        room_id = graphene.Int(required=True)
        room_number = graphene.String()
        room_type = graphene.String()
        price_per_day = graphene.Float()
        price_per_month = graphene.Float()
        status = graphene.String()
        capacity = graphene.Int()
        is_active = graphene.Boolean()

    success = graphene.Boolean()
    message = graphene.String()
    room = graphene.Field(RoomType)

    @staticmethod
    def mutate(root, info, room_id, **kwargs):
        actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
        try:
            room = PropertyService.update_room(room_id, kwargs, actor=actor)
            return UpdateRoomMutation(success=True, message="Room updated", room=RoomType(**room))
        except ApiException as exc:
            return UpdateRoomMutation(success=False, message=str(exc), room=None)


class DeleteRoomMutation(graphene.Mutation):
    class Arguments:
        room_id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @staticmethod
    def mutate(root, info, room_id):
        try:
            PropertyService.delete_room(room_id)
            return DeleteRoomMutation(success=True, message="Room deleted")
        except ApiException as exc:
            return DeleteRoomMutation(success=False, message=str(exc))


class CreateBedMutation(graphene.Mutation):
    class Arguments:
        room_id = graphene.Int(required=True)
        bed_number = graphene.String(required=True)
        status = graphene.String()
        is_active = graphene.Boolean()

    success = graphene.Boolean()
    message = graphene.String()
    bed = graphene.Field(BedType)

    @staticmethod
    def mutate(root, info, **kwargs):
        actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
        try:
            bed = PropertyService.create_bed(kwargs, actor=actor)
            return CreateBedMutation(success=True, message="Bed created", bed=BedType(**bed))
        except ApiException as exc:
            return CreateBedMutation(success=False, message=str(exc), bed=None)


class UpdateBedMutation(graphene.Mutation):
    class Arguments:
        bed_id = graphene.Int(required=True)
        bed_number = graphene.String()
        status = graphene.String()
        is_active = graphene.Boolean()

    success = graphene.Boolean()
    message = graphene.String()
    bed = graphene.Field(BedType)

    @staticmethod
    def mutate(root, info, bed_id, **kwargs):
        actor = info.context.user if info.context.user and info.context.user.is_authenticated else None
        try:
            bed = PropertyService.update_bed(bed_id, kwargs, actor=actor)
            return UpdateBedMutation(success=True, message="Bed updated", bed=BedType(**bed))
        except ApiException as exc:
            return UpdateBedMutation(success=False, message=str(exc), bed=None)


class DeleteBedMutation(graphene.Mutation):
    class Arguments:
        bed_id = graphene.Int(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @staticmethod
    def mutate(root, info, bed_id):
        try:
            PropertyService.delete_bed(bed_id)
            return DeleteBedMutation(success=True, message="Bed deleted")
        except ApiException as exc:
            return DeleteBedMutation(success=False, message=str(exc))


class Mutation(graphene.ObjectType):
    create_city = CreateCityMutation.Field()
    update_city = UpdateCityMutation.Field()
    delete_city = DeleteCityMutation.Field()

    create_building = CreateBuildingMutation.Field()
    update_building = UpdateBuildingMutation.Field()
    delete_building = DeleteBuildingMutation.Field()

    create_floor = CreateFloorMutation.Field()
    update_floor = UpdateFloorMutation.Field()
    delete_floor = DeleteFloorMutation.Field()

    create_room = CreateRoomMutation.Field()
    update_room = UpdateRoomMutation.Field()
    delete_room = DeleteRoomMutation.Field()

    create_bed = CreateBedMutation.Field()
    update_bed = UpdateBedMutation.Field()
    delete_bed = DeleteBedMutation.Field()
