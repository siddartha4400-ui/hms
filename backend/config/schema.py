import graphene
import graphql_jwt
from django.contrib.auth import get_user_model
from graphql_jwt.decorators import login_required


class Query(graphene.ObjectType):
    me = graphene.String()

    @login_required
    def resolve_me(self, info):
        return info.context.user.username


class CreateUser(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    message = graphene.String()

    def mutate(self, info, username, password):
        User = get_user_model()

        if User.objects.filter(username=username).exists():
            return CreateUser(message="User already exists")

        User.objects.create_user(
            username=username,
            password=password
        )

        return CreateUser(message="User created successfully")


class Mutation(graphene.ObjectType):

    # ✅ LOGIN
    token_auth = graphql_jwt.ObtainJSONWebToken.Field()

    # ✅ VERIFY TOKEN
    verify_token = graphql_jwt.Verify.Field()

    # ✅ REFRESH TOKEN
    refresh_token = graphql_jwt.Refresh.Field()

    # ✅ REGISTER
    create_user = CreateUser.Field()


schema = graphene.Schema(query=Query, mutation=Mutation)