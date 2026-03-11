import graphene
from graphql_jwt.decorators import login_required

class UserQuery(graphene.ObjectType):
    me = graphene.String()

    @login_required
    def resolve_me(self, info):
        return info.context.user.username