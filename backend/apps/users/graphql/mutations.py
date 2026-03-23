"""User GraphQL mutations for authentication."""
import graphene
from graphql_jwt.shortcuts import get_token
from graphql_jwt.refresh_token.shortcuts import create_refresh_token, get_refresh_token
from apps.users.models import User
from apps.users.services import AuthService, PasswordResetService, UserProfileService
from apps.users.validators import UserValidator
from apps.users.repositories import UserRepository
from apps.users.graphql.types import UserRoleInfoType, RouteType, ROUTES_BY_ROLE
from apps.users.permissions import get_group_from_role
from common.exceptions import ApiException


class SignupMutation(graphene.Mutation):
    """Mutation to handle user signup."""
    
    class Arguments:
        email = graphene.String(required=True)
        password = graphene.String(required=True)
        password_confirm = graphene.String(required=True)
        mobile_number = graphene.String(required=True)
        first_name = graphene.String(required=True)
        last_name = graphene.String()
    
    success = graphene.Boolean()
    message = graphene.String()
    user = graphene.String()  # Will return user id
    
    @staticmethod
    def mutate(root, info, email, password, password_confirm, mobile_number, first_name, last_name=''):
        try:
            payload = {
                'email': email,
                'password': password,
                'password_confirm': password_confirm,
                'mobile_number': mobile_number,
                'first_name': first_name,
                'last_name': last_name,
            }
            user = AuthService.signup(payload)
            return SignupMutation(
                success=True,
                message='Signup successful. Please verify your email.',
                user=str(user.hms_id)
            )
        except ApiException as e:
            return SignupMutation(success=False, message=str(e))
        except Exception as e:
            return SignupMutation(success=False, message=str(e))


class LoginMutation(graphene.Mutation):
    """Mutation to request login OTP or password login."""
    
    class Arguments:
        method = graphene.String(required=True)  # 'password', 'email_otp', 'whatsapp_otp'
        email = graphene.String()
        password = graphene.String()
        mobile_number = graphene.String()
    
    success = graphene.Boolean()
    message = graphene.String()
    token = graphene.String()
    refresh_token = graphene.String()
    user_role = graphene.String()
    hms_id = graphene.Int()
    available_routes = graphene.List(RouteType)
    
    @staticmethod
    def _get_available_routes(django_user, user_profile):
        """Helper to get available routes for user."""
        from apps.users.graphql.types import ROUTES_BY_ROLE
        
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
    
    @staticmethod
    def mutate(root, info, method, email=None, password=None, mobile_number=None):
        try:
            if method == 'password':
                # Password login
                if not email or not password:
                    return LoginMutation(success=False, message='Email and password required')
                
                user, django_user = AuthService.login_with_password(email, password)
                token = get_token(django_user)
                refresh_token_obj = create_refresh_token(django_user)
                
                # Get role and available routes
                role_name = "normal_user"
                if user and user.role is not None:
                    role_name = get_group_from_role(user.role)
                elif django_user.groups.exists():
                    role_name = django_user.groups.first().name
                
                available_routes = LoginMutation._get_available_routes(django_user, user)
                
                return LoginMutation(
                    success=True,
                    message='Login successful',
                    token=token,
                    refresh_token=str(refresh_token_obj),
                    user_role=role_name,
                    hms_id=user.hms_id if user else None,
                    available_routes=available_routes,
                )
            
            elif method == 'email_otp':
                # Email OTP login - request OTP
                if not email:
                    return LoginMutation(success=False, message='Email required')
                
                AuthService.request_login_otp(email, 'email')
                return LoginMutation(
                    success=True,
                    message='OTP sent to your email'
                )
            
            elif method == 'whatsapp_otp':
                # WhatsApp OTP login - request OTP
                if not mobile_number:
                    return LoginMutation(success=False, message='Mobile number required')
                
                AuthService.request_login_otp(mobile_number, 'whatsapp')
                return LoginMutation(
                    success=True,
                    message='OTP sent to your WhatsApp'
                )
            
            else:
                return LoginMutation(success=False, message='Invalid login method')
        
        except ApiException as e:
            return LoginMutation(success=False, message=str(e))
        except Exception as e:
            return LoginMutation(success=False, message=str(e))


class VerifyLoginOTPMutation(graphene.Mutation):
    """Mutation to verify OTP for login."""
    
    class Arguments:
        identifier = graphene.String(required=True)  # email or phone
        otp = graphene.String(required=True)
        otp_type = graphene.String(required=True)  # 'email' or 'whatsapp'
    
    success = graphene.Boolean()
    message = graphene.String()
    token = graphene.String()
    refresh_token = graphene.String()
    user_role = graphene.String()
    hms_id = graphene.Int()
    available_routes = graphene.List(RouteType)
    
    @staticmethod
    def mutate(root, info, identifier, otp, otp_type):
        try:
            user, django_user = AuthService.verify_login_otp(identifier, otp, otp_type)
            token = get_token(django_user)
            refresh_token_obj = create_refresh_token(django_user)
            
            # Get role and available routes
            role_name = "normal_user"
            if user and user.role is not None:
                role_name = get_group_from_role(user.role)
            elif django_user.groups.exists():
                role_name = django_user.groups.first().name
            
            available_routes = LoginMutation._get_available_routes(django_user, user)
            
            return VerifyLoginOTPMutation(
                success=True,
                message='OTP verified successfully',
                token=token,
                refresh_token=str(refresh_token_obj),
                user_role=role_name,
                hms_id=user.hms_id if user else None,
                available_routes=available_routes,
            )
        except ApiException as e:
            return VerifyLoginOTPMutation(success=False, message=str(e))
        except Exception as e:
            return VerifyLoginOTPMutation(success=False, message=str(e))


class RequestPasswordResetMutation(graphene.Mutation):
    """Mutation to request password reset."""
    
    class Arguments:
        email = graphene.String(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    @staticmethod
    def mutate(root, info, email):
        try:
            result = PasswordResetService.request_password_reset(email)
            return RequestPasswordResetMutation(
                success=True,
                message=result['message']
            )
        except ApiException as e:
            return RequestPasswordResetMutation(success=False, message=str(e))
        except Exception as e:
            return RequestPasswordResetMutation(success=False, message=str(e))


class ResetPasswordMutation(graphene.Mutation):
    """Mutation to reset password with token."""
    
    class Arguments:
        token = graphene.String(required=True)
        password = graphene.String(required=True)
        password_confirm = graphene.String(required=True)
    
    success = graphene.Boolean()
    message = graphene.String()
    
    @staticmethod
    def mutate(root, info, token, password, password_confirm):
        try:
            result = PasswordResetService.reset_password(token, password, password_confirm)
            return ResetPasswordMutation(
                success=True,
                message=result['message']
            )
        except ApiException as e:
            return ResetPasswordMutation(success=False, message=str(e))
        except Exception as e:
            return ResetPasswordMutation(success=False, message=str(e))


class UpdateProfileMutation(graphene.Mutation):
    """Mutation to update user profile."""
    
    class Arguments:
        first_name = graphene.String()
        last_name = graphene.String()
        address_line1 = graphene.String()
        address_line2 = graphene.String()
        city = graphene.String()
        state = graphene.String()
        postal_code = graphene.String()
        country = graphene.String()
        dob = graphene.String()
        profile_id = graphene.Int()
    
    success = graphene.Boolean()
    message = graphene.String()
    user = graphene.String()  # serialized user data as JSON
    
    @staticmethod
    def mutate(root, info, **args):
        try:
            # Get current user from context
            if not info.context.user or not info.context.user.is_authenticated:
                return UpdateProfileMutation(success=False, message='Not authenticated')
            
            # Get user profile
            from apps.users.repositories import UserRepository
            user = UserRepository.get_user_by_email(info.context.user.email)
            if not user:
                return UpdateProfileMutation(success=False, message='User not found')
            
            # Prepare payload (remove None values)
            payload = {k: v for k, v in args.items() if v is not None}
            
            # Update profile
            updated_user = UserProfileService.update_user_profile(user, payload)
            serialized = UserProfileService.serialize_user(updated_user)
            
            import json
            return UpdateProfileMutation(
                success=True,
                message='Profile updated successfully',
                user=json.dumps(serialized)
            )
        except ApiException as e:
            return UpdateProfileMutation(success=False, message=str(e))
        except Exception as e:
            return UpdateProfileMutation(success=False, message=str(e))


class LogoutMutation(graphene.Mutation):
    """Mutation to logout user and revoke refresh token."""

    class Arguments:
        refresh_token = graphene.String(required=True)

    success = graphene.Boolean()
    message = graphene.String()

    @staticmethod
    def mutate(root, info, refresh_token):
        try:
            refresh_token_obj = get_refresh_token(refresh_token, info.context)
            refresh_token_obj.revoke(info.context)
            return LogoutMutation(success=True, message='Logged out successfully')
        except Exception:
            # Keep response generic; frontend should always clear local auth regardless.
            return LogoutMutation(success=False, message='Logout completed on client')


class Mutation(graphene.ObjectType):
    """Root mutation object for auth operations."""
    signup = SignupMutation.Field()
    login = LoginMutation.Field()
    verify_login_otp = VerifyLoginOTPMutation.Field()
    request_password_reset = RequestPasswordResetMutation.Field()
    reset_password = ResetPasswordMutation.Field()
    update_profile = UpdateProfileMutation.Field()
    logout = LogoutMutation.Field()