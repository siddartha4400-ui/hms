"""User repositories for database operations."""
from django.contrib.auth.models import User as DjangoUser
from apps.users.models import User, OTP, PasswordResetToken
import random
import string


def _normalize_email(email):
    return (email or '').strip().lower()


class UserRepository:
    """Repository for user-related database operations."""
    
    @staticmethod
    def create_user(email, password, mobile_number, first_name, last_name='', hms_id=1):
        """Create a new user with Django auth and profile."""
        # Create Django user
        django_user = DjangoUser.objects.create_user(
            username=email,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        django_user.set_password(password)
        django_user.save()

        # Create profile user
        user_profile = User.objects.create(
            auth_user=django_user,
            mobile_number=mobile_number,
            hms_id=hms_id,
        )

        return user_profile
    
    @staticmethod
    def get_user_by_email(email):
        """Get user by email."""
        try:
            django_user = DjangoUser.objects.get(email__iexact=_normalize_email(email))
            return User.objects.get(auth_user=django_user)
        except (DjangoUser.DoesNotExist, User.DoesNotExist):
            return None
    
    @staticmethod
    def get_user_by_mobile(mobile_number):
        """Get user by mobile number."""
        try:
            return User.objects.get(mobile_number=mobile_number)
        except User.DoesNotExist:
            return None
    
    @staticmethod
    def get_user_by_id(user_id):
        """Get user by ID."""
        try:
            return User.objects.get(hms_id=user_id)
        except User.DoesNotExist:
            return None
    
    @staticmethod
    def update_user(user, **kwargs):
        """Update user profile fields."""
        allowed_fields = [
            'first_name', 'last_name',
            'address_line1', 'address_line2',
            'city', 'state', 'postal_code', 'country',
            'dob', 'role', 'company_id', 'profile_id'
        ]
        
        for key, value in kwargs.items():
            if key in allowed_fields:
                if key in ['first_name', 'last_name']:
                    setattr(user.auth_user, key, value)
                else:
                    setattr(user, key, value)
        
        user.auth_user.save()
        user.save()
        return user
    
    @staticmethod
    def verify_password(user, password):
        """Verify user password."""
        return user.auth_user.check_password(password)


class OTPRepository:
    """Repository for OTP-related database operations."""
    
    @staticmethod
    def generate_otp_code(length=6):
        """Generate a random OTP code."""
        return ''.join(random.choices(string.digits, k=length))
    
    @staticmethod
    def get_active_otp(identifier, purpose='login'):
        """Get active (valid) OTP for identifier."""
        try:
            otp = OTP.objects.filter(
                identifier=identifier,
                purpose=purpose,
                is_used=False
            ).order_by('-created_at').first()
            
            if otp and otp.is_valid():
                return otp
            return None
        except OTP.DoesNotExist:
            return None
    
    @staticmethod
    def create_otp(identifier, otp_type, purpose='login', expires_in_minutes=5):
        """Create and store OTP."""
        code = OTPRepository.generate_otp_code()
        otp = OTP.create_otp(
            identifier=identifier,
            otp_type=otp_type,
            code=code,
            purpose=purpose,
            expires_in_minutes=expires_in_minutes
        )
        return otp
    
    @staticmethod
    def verify_otp(identifier, code, purpose='login'):
        """Verify OTP code."""
        otp = OTPRepository.get_active_otp(identifier, purpose)
        
        if not otp:
            return False, 'OTP expired or not found'
        
        if otp.code != code:
            otp.increment_attempt()
            remaining = otp.max_attempts - otp.attempt_count
            return False, f'Invalid OTP. {remaining} attempts remaining'
        
        otp.mark_used()
        return True, 'OTP verified successfully'
    
    @staticmethod
    def delete_expired_otps():
        """Delete all expired OTPs."""
        from django.utils import timezone
        expired_otps = OTP.objects.filter(expires_at__lt=timezone.now())
        count = expired_otps.count()
        expired_otps.delete()
        return count


class PasswordResetRepository:
    """Repository for password reset token operations."""
    
    @staticmethod
    def create_reset_token(user):
        """Create password reset token."""
        token = PasswordResetToken.create_token(user)
        return token
    
    @staticmethod
    def get_token_by_value(token_value):
        """Get token object by token value."""
        try:
            return PasswordResetToken.objects.get(token=token_value)
        except PasswordResetToken.DoesNotExist:
            return None
    
    @staticmethod
    def verify_reset_token(token_value):
        """Verify if reset token is valid."""
        token = PasswordResetRepository.get_token_by_value(token_value)
        
        if not token:
            return False, 'Invalid token'
        
        if not token.is_valid():
            return False, 'Token expired'
        
        return True, token
    
    @staticmethod
    def reset_password(token_value, new_password):
        """Reset password using token."""
        is_valid, token = PasswordResetRepository.verify_reset_token(token_value)
        
        if not is_valid:
            return False, token  # token is error message
        
        user = token.user
        user.set_password(new_password)
        user.save()
        token.mark_used()
        
        return True, 'Password reset successfully'