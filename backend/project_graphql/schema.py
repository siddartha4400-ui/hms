import graphene
import graphql_jwt

from config.mutations.auth import CreateUser
from config.mutations.whatsapp import SendWhatsappTemplate
from config.queries.user_queries import UserQuery


class Query(UserQuery, graphene.ObjectType):
    pass


class Mutation(graphene.ObjectType):
    create_user = CreateUser.Field()
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
    send_whatsapp_template = SendWhatsappTemplate.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)