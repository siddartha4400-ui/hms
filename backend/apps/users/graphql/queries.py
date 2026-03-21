"""User GraphQL queries for fetching user data."""
import graphene
from apps.users.services import UserProfileService
from apps.users.repositories import UserRepository
from common.exceptions import ApiException
import json


class UserType(graphene.ObjectType):
    """GraphQL type for user data."""
    id = graphene.Int()
    email = graphene.String()
    username = graphene.String()
    mobile_number = graphene.String()
    first_name = graphene.String()
    last_name = graphene.String()
    role = graphene.Int()
    address_line1 = graphene.String()
    address_line2 = graphene.String()
    city = graphene.String()
    state = graphene.String()
    postal_code = graphene.String()
    country = graphene.String()
    company_id = graphene.String()
    profile_id = graphene.Int()
    profile_picture_url = graphene.String()
    dob = graphene.String()
    is_verified = graphene.Boolean()
    is_active = graphene.Boolean()
    created_at = graphene.String()
    updated_at = graphene.String()


class Query(graphene.ObjectType):
    """Root query object for user operations."""
    
    get_user_profile = graphene.Field(UserType)
    
    def resolve_get_user_profile(self, info):
        """Get current user's profile."""
        try:
            # Get current user from context
            if not info.context.user or not info.context.user.is_authenticated:
                raise ApiException('Not authenticated')
            
            # Get user profile
            user = UserRepository.get_user_by_email(info.context.user.email)
            if not user:
                raise ApiException('User not found')
            
            serialized = UserProfileService.serialize_user(user)
            return UserType(**serialized)
        except ApiException as e:
            raise Exception(str(e))
        except Exception as e:
            raise Exception(str(e))