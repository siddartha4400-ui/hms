import graphene
import graphql_jwt

from config.mutations.auth import CreateUser
from config.mutations.whatsapp import SendWhatsappTemplate
from config.queries.user_queries import UserQuery
from apps.users.graphql.mutations import Mutation as UsersMutation
from apps.users.graphql.queries import Query as UsersQuery


class Query(UserQuery, UsersQuery, graphene.ObjectType):
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


schema = graphene.Schema(query=Query, mutation=Mutation)