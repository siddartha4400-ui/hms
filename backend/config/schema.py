import graphene
import graphql_jwt
from graphene_django import DjangoObjectType
from django.contrib.auth import get_user_model
from graphql_jwt.decorators import login_required

from inventory.models import Location, Building, Floor, Room
from bookings.models import Guest, Booking
from users.permissions import manager_required, staff_required, admin_required

User = get_user_model()


# --- Types ---

class UserType(DjangoObjectType):
    class Meta:
        model = User
        fields = ("id", "username", "email", "first_name", "last_name", "role", "phone", "is_active", "created_at")


class LocationType(DjangoObjectType):
    class Meta:
        model = Location
        fields = "__all__"


class BuildingType(DjangoObjectType):
    class Meta:
        model = Building
        fields = "__all__"


class FloorType(DjangoObjectType):
    class Meta:
        model = Floor
        fields = "__all__"


class RoomType(DjangoObjectType):
    class Meta:
        model = Room
        fields = "__all__"


class GuestType(DjangoObjectType):
    class Meta:
        model = Guest
        fields = "__all__"


class BookingType(DjangoObjectType):
    class Meta:
        model = Booking
        fields = "__all__"


# --- Queries ---

class Query(graphene.ObjectType):
    me = graphene.Field(UserType)
    users = graphene.List(UserType)

    all_rooms = graphene.List(RoomType, status=graphene.String())
    room = graphene.Field(RoomType, id=graphene.Int(required=True))

    all_locations = graphene.List(LocationType)
    all_buildings = graphene.List(BuildingType, location_id=graphene.Int())
    all_floors = graphene.List(FloorType, building_id=graphene.Int())

    all_guests = graphene.List(GuestType)
    guest = graphene.Field(GuestType, id=graphene.Int(required=True))

    all_bookings = graphene.List(BookingType, status=graphene.String())
    booking = graphene.Field(BookingType, id=graphene.Int(required=True))

    dashboard_stats = graphene.JSONString()

    @login_required
    def resolve_me(self, info):
        return info.context.user

    @login_required
    def resolve_users(self, info):
        return User.objects.all()

    @login_required
    def resolve_all_rooms(self, info, status=None):
        qs = Room.objects.select_related("building", "floor")
        if status:
            qs = qs.filter(status=status)
        return qs

    @login_required
    def resolve_room(self, info, id):
        return Room.objects.select_related("building", "floor").get(pk=id)

    @login_required
    def resolve_all_locations(self, info):
        return Location.objects.all()

    @login_required
    def resolve_all_buildings(self, info, location_id=None):
        qs = Building.objects.select_related("location")
        if location_id:
            qs = qs.filter(location_id=location_id)
        return qs

    @login_required
    def resolve_all_floors(self, info, building_id=None):
        qs = Floor.objects.select_related("building")
        if building_id:
            qs = qs.filter(building_id=building_id)
        return qs

    @login_required
    def resolve_all_guests(self, info):
        return Guest.objects.all()

    @login_required
    def resolve_guest(self, info, id):
        return Guest.objects.get(pk=id)

    @login_required
    def resolve_all_bookings(self, info, status=None):
        qs = Booking.objects.select_related("guest", "room", "room__building")
        if status:
            qs = qs.filter(status=status)
        return qs

    @login_required
    def resolve_booking(self, info, id):
        return Booking.objects.select_related("guest", "room").get(pk=id)

    @login_required
    def resolve_dashboard_stats(self, info):
        total_rooms = Room.objects.count()
        available = Room.objects.filter(status="available").count()
        booked = Room.objects.filter(status="booked").count()
        maintenance = Room.objects.filter(status="maintenance").count()
        active_bookings = Booking.objects.filter(status__in=["confirmed", "checked_in"]).count()
        pending_bookings = Booking.objects.filter(status="pending").count()
        total_guests = Guest.objects.count()
        return {
            "total_rooms": total_rooms,
            "available_rooms": available,
            "booked_rooms": booked,
            "maintenance_rooms": maintenance,
            "active_bookings": active_bookings,
            "pending_bookings": pending_bookings,
            "total_guests": total_guests,
        }


# --- Mutations ---

class CreateUser(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)
        email = graphene.String()
        role = graphene.String()

    message = graphene.String()

    def mutate(self, info, username, password, email=None, role="guest"):
        if User.objects.filter(username=username).exists():
            return CreateUser(message="User already exists")
        user = User(username=username, role=role)
        if email:
            user.email = email
        user.set_password(password)
        user.save()
        return CreateUser(message="User created successfully")


class CreateRoom(graphene.Mutation):
    class Arguments:
        building_id = graphene.Int(required=True)
        floor_id = graphene.Int(required=True)
        number = graphene.String(required=True)
        room_type = graphene.String()
        capacity = graphene.Int()
        base_price = graphene.Decimal(required=True)

    room = graphene.Field(RoomType)

    @manager_required
    def mutate(self, info, building_id, floor_id, number, base_price, room_type="", capacity=1):
        room = Room.objects.create(
            building_id=building_id,
            floor_id=floor_id,
            number=number,
            room_type=room_type,
            capacity=capacity,
            base_price=base_price,
        )
        return CreateRoom(room=room)


class UpdateRoom(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        room_type = graphene.String()
        capacity = graphene.Int()
        base_price = graphene.Decimal()
        status = graphene.String()

    room = graphene.Field(RoomType)

    @manager_required
    def mutate(self, info, id, **kwargs):
        room = Room.objects.get(pk=id)
        for key, value in kwargs.items():
            if value is not None:
                setattr(room, key, value)
        room.save()
        return UpdateRoom(room=room)


class CreateGuest(graphene.Mutation):
    class Arguments:
        name = graphene.String(required=True)
        email = graphene.String(required=True)
        phone = graphene.String()

    guest = graphene.Field(GuestType)

    @staff_required
    def mutate(self, info, name, email, phone=""):
        guest = Guest.objects.create(name=name, email=email, phone=phone)
        return CreateGuest(guest=guest)


class CreateBooking(graphene.Mutation):
    class Arguments:
        guest_id = graphene.Int(required=True)
        room_id = graphene.Int(required=True)
        check_in = graphene.Date(required=True)
        check_out = graphene.Date(required=True)
        total_price = graphene.Decimal()
        notes = graphene.String()

    booking = graphene.Field(BookingType)
    message = graphene.String()

    @staff_required
    def mutate(self, info, guest_id, room_id, check_in, check_out, total_price=None, notes=""):
        # Check for overlapping bookings
        overlap = Booking.objects.filter(
            room_id=room_id,
            status__in=["pending", "confirmed", "checked_in"],
            check_in__lt=check_out,
            check_out__gt=check_in,
        ).exists()
        if overlap:
            return CreateBooking(booking=None, message="Room is already booked for these dates")

        booking = Booking.objects.create(
            guest_id=guest_id,
            room_id=room_id,
            check_in=check_in,
            check_out=check_out,
            total_price=total_price,
            notes=notes,
        )
        # Mark room as booked
        Room.objects.filter(pk=room_id).update(status="booked")
        return CreateBooking(booking=booking, message="Booking created successfully")


class UpdateBookingStatus(graphene.Mutation):
    class Arguments:
        id = graphene.Int(required=True)
        status = graphene.String(required=True)

    booking = graphene.Field(BookingType)

    @staff_required
    def mutate(self, info, id, status):
        booking = Booking.objects.get(pk=id)
        booking.status = status
        booking.save()
        # If checked_out or cancelled, free the room
        if status in ["checked_out", "cancelled"]:
            Room.objects.filter(pk=booking.room_id).update(status="available")
        return UpdateBookingStatus(booking=booking)


class Mutation(graphene.ObjectType):
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()

    create_user = CreateUser.Field()
    create_room = CreateRoom.Field()
    update_room = UpdateRoom.Field()
    create_guest = CreateGuest.Field()
    create_booking = CreateBooking.Field()
    update_booking_status = UpdateBookingStatus.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)
