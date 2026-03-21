import graphene
import graphql_jwt

from config.mutations.auth import CreateUser
from config.mutations.whatsapp import SendWhatsappTemplate
from config.queries.user_queries import UserQuery
from apps.users.graphql.mutations import Mutation as UsersMutation
from apps.users.graphql.queries import Query as UsersQuery
from apps.subsites.graphql.mutations import Mutation as SubsitesMutation
from apps.subsites.graphql.queries import Query as SubsitesQuery
from apps.propertys.graphql.mutations import Mutation as PropertysMutation
from apps.propertys.graphql.queries import Query as PropertysQuery


class Query(UserQuery, UsersQuery, SubsitesQuery, PropertysQuery, graphene.ObjectType):
    pass


class Mutation(graphene.ObjectType):
    # Auth mutations
    create_user = CreateUser.Field()
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
    
    # WhatsApp mutations
    send_whatsapp_template = SendWhatsappTemplate.Field()
    
    # Users mutations
    signup = UsersMutation.signup
    login = UsersMutation.login
    verify_login_otp = UsersMutation.verify_login_otp
    request_password_reset = UsersMutation.request_password_reset
    reset_password = UsersMutation.reset_password
    update_profile = UsersMutation.update_profile
    logout = UsersMutation.logout

    # Subsites (HMS) mutations
    create_hms = SubsitesMutation.create_hms
    update_hms = SubsitesMutation.update_hms
    delete_hms = SubsitesMutation.delete_hms

    # Property hierarchy mutations
    create_city = PropertysMutation.create_city
    update_city = PropertysMutation.update_city
    delete_city = PropertysMutation.delete_city

    create_building = PropertysMutation.create_building
    update_building = PropertysMutation.update_building
    delete_building = PropertysMutation.delete_building

    create_floor = PropertysMutation.create_floor
    update_floor = PropertysMutation.update_floor
    delete_floor = PropertysMutation.delete_floor

    create_room = PropertysMutation.create_room
    update_room = PropertysMutation.update_room
    delete_room = PropertysMutation.delete_room

    create_bed = PropertysMutation.create_bed
    update_bed = PropertysMutation.update_bed
    delete_bed = PropertysMutation.delete_bed


schema = graphene.Schema(query=Query, mutation=Mutation)