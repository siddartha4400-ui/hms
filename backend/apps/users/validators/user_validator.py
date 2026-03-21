"""User validation rules and exceptions."""
from common.exceptions import ApiException
import re
from django.contrib.auth.models import User as DjangoUser


class UserValidator:
    """Validator for user-related operations."""
    
    @staticmethod
    def validate_email(email):
        """Validate email format."""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            raise ApiException('Invalid email format')
        return email
    
    @staticmethod
    def validate_phone(phone):
        """Validate phone number format (10-15 digits)."""
        phone_clean = re.sub(r'\D', '', phone)
        if len(phone_clean) < 10 or len(phone_clean) > 15:
            raise ApiException('Invalid phone number format')
        return phone_clean
    
    @staticmethod
    def validate_password(password):
        """Validate password strength."""
        if len(password) < 8:
            raise ApiException('Password must be at least 8 characters')
        if not any(char.isupper() for char in password):
            raise ApiException('Password must contain at least one uppercase letter')
        if not any(char.isdigit() for char in password):
            raise ApiException('Password must contain at least one digit')
        return password
    
    @staticmethod
    def validate_signup_payload(data):
        """Validate signup request payload."""
        required_fields = ['email', 'password', 'password_confirm', 'mobile_number', 'first_name']
        for field in required_fields:
            if field not in data or not data[field]:
                raise ApiException(f'{field} is required')
        
        email = data['email'].lower().strip()
        password = data['password']
        password_confirm = data['password_confirm']
        mobile_number = data['mobile_number']
        first_name = data['first_name']
        
        # Validate email format
        UserValidator.validate_email(email)
        
        # Check email already exists
        if DjangoUser.objects.filter(email=email).exists():
            raise ApiException('Email already registered')
        
        # Validate password
        UserValidator.validate_password(password)
        
        # Confirm password match
        if password != password_confirm:
            raise ApiException('Passwords do not match')
        
        # Validate phone
        UserValidator.validate_phone(mobile_number)
        
        return {
            'email': email,
            'password': password,
            'mobile_number': mobile_number,
            'first_name': first_name,
            'last_name': data.get('last_name', ''),
        }
    
    @staticmethod
    def validate_login_payload(data):
        """Validate login request payload."""
        login_method = data.get('method')  # 'password', 'email_otp', 'whatsapp_otp'
        
        if not login_method:
            raise ApiException('Login method is required')
        
        if login_method == 'password':
            if 'email' not in data or not data['email']:
                raise ApiException('Email is required for password login')
            if 'password' not in data or not data['password']:
                raise ApiException('Password is required')
            return {
                'method': 'password',
                'email': data['email'].lower().strip(),
                'password': data['password']
            }
        
        elif login_method in ['email_otp', 'whatsapp_otp']:
            if login_method == 'email_otp':
                if 'email' not in data or not data['email']:
                    raise ApiException('Email is required for OTP login')
                UserValidator.validate_email(data['email'])
                return {
                    'method': login_method,
                    'identifier': data['email'].lower().strip(),
                    'type': 'email'
                }
            elif login_method == 'whatsapp_otp':
                if 'mobile_number' not in data or not data['mobile_number']:
                    raise ApiException('Mobile number is required for WhatsApp OTP login')
                UserValidator.validate_phone(data['mobile_number'])
                return {
                    'method': login_method,
                    'identifier': data['mobile_number'],
                    'type': 'whatsapp'
                }
        else:
            raise ApiException('Invalid login method')
    
    @staticmethod
    def validate_otp_payload(data):
        """Validate OTP verification request."""
        required_fields = ['identifier', 'otp', 'purpose']
        for field in required_fields:
            if field not in data or not data[field]:
                raise ApiException(f'{field} is required')
        
        otp_code = str(data['otp']).strip()
        if len(otp_code) != 6 or not otp_code.isdigit():
            raise ApiException('OTP must be 6 digits')
        
        return {
            'identifier': data['identifier'],
            'otp': otp_code,
            'purpose': data['purpose']  # 'login', 'signup', 'password_reset'
        }
    
    @staticmethod
    def validate_password_reset_payload(data):
        """Validate password reset request."""
        required_fields = ['email']
        for field in required_fields:
            if field not in data or not data[field]:
                raise ApiException(f'{field} is required')
        
        email = data['email'].lower().strip()
        UserValidator.validate_email(email)
        
        if not DjangoUser.objects.filter(email=email).exists():
            # Don't reveal if email exists for security
            raise ApiException('If that email is registered, a reset link will be sent')
        
        return {'email': email}
    
    @staticmethod
    def validate_reset_password_payload(data):
        """Validate password reset confirmation."""
        required_fields = ['token', 'password', 'password_confirm']
        for field in required_fields:
            if field not in data or not data[field]:
                raise ApiException(f'{field} is required')
        
        password = data['password']
        password_confirm = data['password_confirm']
        
        if password != password_confirm:
            raise ApiException('Passwords do not match')
        
        UserValidator.validate_password(password)
        
        return {
            'token': data['token'],
            'password': password
        }
    
    @staticmethod
    def validate_update_profile_payload(data):
        """Validate profile update request (excluding email and phone)."""
        allowed_fields = [
            'first_name',
            'last_name',
            'address_line1',
            'address_line2',
            'city',
            'state',
            'postal_code',
            'country',
            'dob',
            'profile_id',
        ]
        
        # Reject email and mobile_number updates
        if 'email' in data or 'mobile_number' in data:
            raise ApiException('Cannot update email or mobile number')
        
        # Validate that all provided fields are allowed
        for field in data:
            if field not in allowed_fields:
                raise ApiException(f'Cannot update field: {field}')
        
        return data