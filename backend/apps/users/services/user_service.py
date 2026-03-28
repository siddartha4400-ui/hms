"""User services for business logic."""
from apps.users.repositories import UserRepository, OTPRepository, PasswordResetRepository
from apps.users.validators import UserValidator
from apps.users.permissions import NORMAL_USER_GROUP, get_group_from_role
from common.exceptions import ApiException
from django.contrib.auth.models import User as DjangoUser, Group
from django.core.mail import send_mail
from django.conf import settings
import logging
import re
import os

logger = logging.getLogger(__name__)


def _get_profile_picture_url(profile_id):
    if not profile_id:
        return ""

    try:
        from apps.attachments.models import Attachment

        attachment = Attachment.objects.filter(id=profile_id).first()
        return attachment.file_url if attachment else ""
    except Exception:
        return ""


def _to_iso_string(value):
    if not value:
        return ""

    iso_fn = getattr(value, 'isoformat', None)
    if callable(iso_fn):
        return iso_fn()

    return str(value)


def _send_email_otp(to_email: str, otp_code: str, purpose: str = 'login') -> None:
    """Send OTP via email using Django's email backend."""
    subject_map = {
        'login': 'Your HotelSphere Login OTP',
        'signup': 'Verify your HotelSphere account',
        'password_reset': 'HotelSphere Password Reset OTP',
        'email_verification': 'Verify your HotelSphere email',
    }
    subject = subject_map.get(purpose, 'Your HotelSphere OTP')
    message = (
        f"Your one-time password is: {otp_code}\n\n"
        f"This code is valid for 5 minutes. Do not share it with anyone."
    )
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[to_email],
            fail_silently=False,
        )
    except Exception as exc:
        logger.error("Failed to send OTP email to %s: %s", to_email, exc)
        raise ApiException("Failed to send OTP email. Please try again.") from exc


def _send_whatsapp_otp(mobile_number: str, otp_code: str) -> None:
    """Send OTP via WhatsApp using the existing helper."""
    from config.helpers.whatsapp import send_whatsapp_template
    normalized_mobile = re.sub(r'\D', '', mobile_number)
    template_name = os.getenv('WHATSAPP_OTP_TEMPLATE', 'hms_otp')
    result = send_whatsapp_template(
        to=normalized_mobile,
        template_name=template_name,
        variables=[otp_code],
    )
    if 'error' in result:
        logger.error("WhatsApp OTP send failed for %s: %s", mobile_number, result)
        raise ApiException(f"Failed to send WhatsApp OTP: {result.get('error')}")


def _assign_user_group(django_user, user_profile=None):
    """Assign user to appropriate group based on their role."""
    # Don't reassign if user already has groups
    if django_user.groups.exists():
        return
    
    # Determine group based on role
    if user_profile and user_profile.role is not None:
        group_name = get_group_from_role(user_profile.role)
    else:
        # Default to normal user
        group_name = NORMAL_USER_GROUP
    
    try:
        group = Group.objects.get(name=group_name)
        django_user.groups.add(group)
    except Group.DoesNotExist:
        logger.warning(f"Group '{group_name}' does not exist. Run setup_groups management command.")


class AuthService:
    """Service for authentication operations."""
    
    @staticmethod
    def signup(payload):
        """Handle user signup."""
        # Validate payload
        validated_data = UserValidator.validate_signup_payload(payload)
        
        # Create user via repository
        user = UserRepository.create_user(
            email=validated_data['email'],
            password=validated_data['password'],
            mobile_number=validated_data['mobile_number'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name']
        )
        
        # Assign user to normal_user group
        try:
            normal_user_group = Group.objects.get(name=NORMAL_USER_GROUP)
            user.auth_user.groups.add(normal_user_group)
        except Group.DoesNotExist:
            # If group doesn't exist yet, it will be created by setup_groups command
            logger.warning(f"Group '{NORMAL_USER_GROUP}' does not exist. Run setup_groups management command.")

        # Send welcome email (best-effort)
        try:
            send_mail(
                subject='Welcome to HotelSphere',
                message=(
                    f"Hi {validated_data['first_name']},\n\n"
                    f"Your account has been created successfully.\n"
                    f"You can now log in at {settings.FRONTEND_URL}/login"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[validated_data['email']],
                fail_silently=True,
            )
        except Exception:
            pass

        return user
    
    @staticmethod
    def login_with_password(email, password):
        """Handle password-based login."""
        django_user = DjangoUser.objects.filter(email=email).first()

        if not django_user:
            raise ApiException('Invalid email or password')

        # Verify password against the auth user directly (avoids redundant profile lookup)
        if not django_user.check_password(password):
            raise ApiException('Invalid email or password')

        if not django_user.is_active:
            raise ApiException('Account is inactive')

        # Get profile; auto-create a minimal one for admin/legacy accounts that have no profile
        user = UserRepository.get_user_by_email(email)
        if not user:
            from apps.users.models import User as UserModel
            user = UserModel.objects.create(
                auth_user=django_user,
                mobile_number=f'uid{django_user.pk}',  # placeholder until user updates profile
                hms_id=1,
            )
        
        # Assign role-based group if not already assigned
        _assign_user_group(django_user, user)
        
        return user, django_user
    
    @staticmethod
    def request_login_otp(identifier, otp_type):
        """Request OTP for login (email or WhatsApp)."""
        # Determine if identifier is email or phone
        if otp_type == 'email':
            user = UserRepository.get_user_by_email(identifier)
            if not user:
                # Don't reveal if email exists for security
                raise ApiException('If that email is registered with us, you will receive an OTP')
        elif otp_type == 'whatsapp':
            identifier = re.sub(r'\D', '', identifier)
            user = UserRepository.get_user_by_mobile(identifier)

            # Backfill legacy/broken subsite admins where HMS exists but profile row is missing.
            if not user:
                from apps.subsites.models import HMS
                from apps.users.models import User as UserModel

                hms = HMS.objects.select_related('auth_user').filter(mobile_number=identifier).first()
                if hms and hms.auth_user:
                    user = UserModel.objects.filter(auth_user=hms.auth_user).first()
                    if user:
                        if user.mobile_number != identifier:
                            user.mobile_number = identifier
                            user.hms_id = hms.id
                            user.role = 1
                            user.is_verified = True
                            user.save(update_fields=['mobile_number', 'hms_id', 'role', 'is_verified'])
                    else:
                        user = UserModel.objects.create(
                            auth_user=hms.auth_user,
                            mobile_number=identifier,
                            hms_id=hms.id,
                            role=1,
                            is_verified=True,
                        )

                    _assign_user_group(hms.auth_user, user)

            if not user:
                raise ApiException('If that number is registered with us, you will receive an OTP')
        else:
            raise ApiException('Invalid OTP type')
        
        # Create OTP
        otp = OTPRepository.create_otp(
            identifier=identifier,
            otp_type=otp_type,
            purpose='login',
            expires_in_minutes=5
        )

        if otp_type == 'email':
            _send_email_otp(identifier, otp.code, purpose='login')
        elif otp_type == 'whatsapp':
            _send_whatsapp_otp(identifier, otp.code)

        return {'message': 'OTP sent successfully', 'otp': otp}
    
    @staticmethod
    def verify_login_otp(identifier, otp_code, otp_type):
        """Verify OTP for login."""
        if otp_type == 'whatsapp':
            identifier = re.sub(r'\D', '', identifier)

        # Verify OTP
        success, message = OTPRepository.verify_otp(
            identifier=identifier,
            code=otp_code,
            purpose='login'
        )
        
        if not success:
            raise ApiException(message)
        
        # Get user
        if otp_type == 'email':
            user = UserRepository.get_user_by_email(identifier)
        else:
            user = UserRepository.get_user_by_mobile(identifier)
        
        if not user:
            raise ApiException('User not found')
        
        django_user = user.auth_user
        
        # Assign role-based group if not already assigned
        _assign_user_group(django_user, user)
        
        return user, django_user
    
    @staticmethod
    def request_signup_otp(email, otp_type='email'):
        """Request OTP for signup."""
        # Check if email already exists
        if DjangoUser.objects.filter(email=email).exists():
            raise ApiException('Email already registered')
        
        # Create OTP
        otp = OTPRepository.create_otp(
            identifier=email,
            otp_type=otp_type,
            purpose='signup',
            expires_in_minutes=10
        )

        _send_email_otp(email, otp.code, purpose='signup')

        return {'message': 'OTP sent successfully', 'otp': otp}
    
    @staticmethod
    def verify_signup_otp(email, otp_code):
        """Verify OTP for signup."""
        success, message = OTPRepository.verify_otp(
            identifier=email,
            code=otp_code,
            purpose='signup'
        )
        
        if not success:
            raise ApiException(message)
        
        return {'message': 'OTP verified successfully'}


class PasswordResetService:
    """Service for password reset operations."""
    
    @staticmethod
    def request_password_reset(email):
        """Request password reset."""
        # Validate payload
        validated_data = UserValidator.validate_password_reset_payload({'email': email})
        
        # Get user
        django_user = DjangoUser.objects.filter(email=validated_data['email']).first()
        if not django_user:
            raise ApiException('If that email is registered, a reset link will be sent')
        
        # Create reset token
        token = PasswordResetRepository.create_reset_token(django_user)

        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reset_link = f"{frontend_url}/reset-password?token={token.token}"
        try:
            send_mail(
                subject='Reset your HotelSphere password',
                message=(
                    f"You requested a password reset for your HotelSphere account.\n\n"
                    f"Click the link below to set a new password (valid for 24 hours):\n"
                    f"{reset_link}\n\n"
                    f"If you did not request this, you can safely ignore this email."
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception as exc:
            logger.error("Failed to send password reset email to %s: %s", email, exc)
            raise ApiException("Failed to send reset email. Please try again.") from exc

        return {'message': 'Password reset link sent to email'}
    
    @staticmethod
    def verify_reset_token(token):
        """Verify password reset token."""
        is_valid, result = PasswordResetRepository.verify_reset_token(token)
        
        if not is_valid:
            raise ApiException(result)
        
        return {'message': 'Token is valid'}
    
    @staticmethod
    def reset_password(token, password, password_confirm):
        """Reset password with token."""
        # Validate password
        if password != password_confirm:
            raise ApiException('Passwords do not match')
        
        UserValidator.validate_password(password)
        
        # Reset password
        success, message = PasswordResetRepository.reset_password(token, password)
        
        if not success:
            raise ApiException(message)
        
        return {'message': message}


class UserProfileService:
    """Service for user profile operations."""
    
    @staticmethod
    def get_user_profile(user_id):
        """Get user profile."""
        user = UserRepository.get_user_by_id(user_id)
        
        if not user:
            raise ApiException('User not found')
        
        return user
    
    @staticmethod
    def update_user_profile(user, payload):
        """Update user profile (excluding email and phone)."""
        # Validate that email and phone are not being updated
        validated_data = UserValidator.validate_update_profile_payload(payload)
        
        # Update user
        updated_user = UserRepository.update_user(user, **validated_data)
        
        return updated_user
    
    @staticmethod
    def serialize_user(user):
        """Serialize user object to dict."""
        dob_value = _to_iso_string(getattr(user, 'dob', None))
        created_at_value = _to_iso_string(getattr(user, 'created_at', None))
        updated_at_value = _to_iso_string(getattr(user, 'updated_at', None))

        return {
            'id': user.hms_id,
            'email': user.email,
            'username': user.username,
            'mobile_number': user.mobile_number,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'address_line1': user.address_line1,
            'address_line2': user.address_line2,
            'city': user.city,
            'state': user.state,
            'postal_code': user.postal_code,
            'country': user.country,
            'company_id': user.company_id,
            'profile_id': user.profile_id,
            'profile_picture_url': _get_profile_picture_url(user.profile_id),
            'dob': dob_value,
            'is_verified': user.is_verified,
            'is_active': user.is_active,
            'created_at': created_at_value,
            'updated_at': updated_at_value,
        }