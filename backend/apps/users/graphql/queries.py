"""User GraphQL queries for fetching user data."""
import graphene
from apps.users.services import UserProfileService
from apps.users.repositories import UserRepository
from apps.users.graphql.types import (
    UserRoleInfoType, 
    GroupType, 
    PermissionType, 
    RouteType,
    ROUTES_BY_ROLE,
)
from apps.users.permissions import get_group_from_role
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
    get_user_role_info = graphene.Field(UserRoleInfoType)
    get_available_routes = graphene.List(RouteType)
    get_user_groups = graphene.List(GroupType)
    get_user_permissions = graphene.List(PermissionType)
    
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
    
    def resolve_get_user_role_info(self, info):
        """Get user's role and permission information."""
        try:
            # Get current user from context
            if not info.context.user or not info.context.user.is_authenticated:
                raise ApiException('Not authenticated')
            
            django_user = info.context.user
            user_profile = UserRepository.get_user_by_email(django_user.email)
            
            # Get user's groups
            groups = list(django_user.groups.all())
            
            # Get user's direct permissions
            permissions = list(django_user.user_permissions.all())
            
            # Get primary group name (first group or based on role)
            role_name = "normal_user"
            if user_profile and user_profile.role is not None:
                role_name = get_group_from_role(user_profile.role)
            elif groups:
                role_name = groups[0].name
            
            return UserRoleInfoType(
                user_id=django_user.id,
                email=django_user.email,
                username=django_user.username,
                groups=groups,
                permissions=permissions,
                role_name=role_name,
            )
        except ApiException as e:
            raise Exception(str(e))
        except Exception as e:
            raise Exception(str(e))
    
    def resolve_get_available_routes(self, info):
        """Get routes available to the current user based on their role."""
        try:
            # Get current user from context
            if not info.context.user or not info.context.user.is_authenticated:
                raise ApiException('Not authenticated')
            
            django_user = info.context.user
            user_profile = UserRepository.get_user_by_email(django_user.email)
            
            # Determine user's role/group
            role_name = "normal_user"
            if user_profile and user_profile.role is not None:
                role_name = get_group_from_role(user_profile.role)
            elif django_user.groups.exists():
                role_name = django_user.groups.first().name
            
            # Get routes for this role
            routes = ROUTES_BY_ROLE.get(role_name, [])
            
            # Filter routes based on user's actual permissions
            available_routes = []
            for route in routes:
                perm = route.get('requires_permission')
                
                # If no permission required, always visible
                if not perm:
                    available_routes.append(
                        RouteType(
                            path=route['path'],
                            name=route['name'],
                            description=route['description'],
                            icon=route.get('icon'),
                            requires_permission=perm,
                            visible=True,
                        )
                    )
                    continue
                
                # Check if user has the permission
                app_label, codename = perm.split('.')
                has_perm = django_user.has_perm(f'{app_label}.{codename}')
                
                if has_perm:
                    available_routes.append(
                        RouteType(
                            path=route['path'],
                            name=route['name'],
                            description=route['description'],
                            icon=route.get('icon'),
                            requires_permission=perm,
                            visible=True,
                        )
                    )
            
            return available_routes
        except ApiException as e:
            raise Exception(str(e))
        except Exception as e:
            raise Exception(str(e))
    
    def resolve_get_user_groups(self, info):
        """Get all groups the current user belongs to."""
        try:
            if not info.context.user or not info.context.user.is_authenticated:
                raise ApiException('Not authenticated')
            
            return list(info.context.user.groups.all())
        except ApiException as e:
            raise Exception(str(e))
        except Exception as e:
            raise Exception(str(e))
    
    def resolve_get_user_permissions(self, info):
        """Get all permissions the current user has (direct + group)."""
        try:
            if not info.context.user or not info.context.user.is_authenticated:
                raise ApiException('Not authenticated')
            
            django_user = info.context.user
            
            # Get user permissions
            user_perms = set(django_user.user_permissions.all())
            
            # Get group permissions
            for group in django_user.groups.all():
                user_perms.update(group.permissions.all())
            
            return list(user_perms)
        except ApiException as e:
            raise Exception(str(e))
        except Exception as e:
            raise Exception(str(e))