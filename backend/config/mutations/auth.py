import graphene
from django.contrib.auth import get_user_model

class CreateUser(graphene.Mutation):
    class Arguments:
        username = graphene.String(required=True)
        password = graphene.String(required=True)

    message = graphene.String()

    def mutate(self, info, username, password):
        User = get_user_model()
        if User.objects.filter(username=username).exists():
            return CreateUser(message="User already exists")
        User.objects.create_user(username=username, password=password)
        return CreateUser(message="User created successfully")