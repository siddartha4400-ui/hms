import graphene
import graphql_jwt

# Queries
from .queries.user_queries import UserQuery

# Mutations
from .mutations.auth import CreateUser
from .mutations.whatsapp import SendWhatsappTemplate

class Query(UserQuery, graphene.ObjectType):
    # You can add more queries from other features here
    pass

class Mutation(graphene.ObjectType):
    # Auth
    create_user = CreateUser.Field()
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()
    verify_token = graphql_jwt.Verify.Field()
    refresh_token = graphql_jwt.Refresh.Field()
    # WhatsApp
    send_whatsapp_template = SendWhatsappTemplate.Field()

schema = graphene.Schema(query=Query, mutation=Mutation)

