"""OTP model for time-based OTP authentication."""
from django.db import models
from django.utils import timezone
from datetime import timedelta


OTP_TYPE_CHOICES = [
    ('email', 'Email OTP'),
    ('whatsapp', 'WhatsApp OTP'),
    ('sms', 'SMS OTP'),
]


class OTP(models.Model):
    """One-Time Password storage model for authentication."""
    
    # OTP identifier (email or phone number)
    identifier = models.CharField(max_length=255, db_index=True)
    
    # OTP code
    code = models.CharField(max_length=6)
    
    # OTP type
    otp_type = models.CharField(max_length=20, choices=OTP_TYPE_CHOICES)
    
    # Attempt tracking
    attempt_count = models.IntegerField(default=0)
    max_attempts = models.IntegerField(default=3)
    
    # Expiry tracking
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    
    # Purpose (optional)
    purpose = models.CharField(
        max_length=20,
        choices=[
            ('login', 'Login'),
            ('signup', 'Signup'),
            ('password_reset', 'Password Reset'),
            ('email_verification', 'Email Verification'),
        ],
        default='login'
    )
    
    class Meta:
        db_table = 'otps'
        app_label = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['identifier', 'is_used']),
            models.Index(fields=['expires_at']),
        ]
    
    def __str__(self):
        return f"OTP for {self.identifier} ({self.otp_type})"
    
    def is_expired(self):
        """Check if OTP has expired."""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Check if OTP is valid (not expired, not used, attempts not exceeded)."""
        return (
            not self.is_expired()
            and not self.is_used
            and self.attempt_count < self.max_attempts
        )
    
    def mark_used(self):
        """Mark OTP as used."""
        self.is_used = True
        self.used_at = timezone.now()
        self.save()
    
    def increment_attempt(self):
        """Increment failed attempt count."""
        self.attempt_count += 1
        self.save()
    
    @staticmethod
    def create_otp(identifier, otp_type, code, purpose='login', expires_in_minutes=5):
        """Factory method to create OTP."""
        expires_at = timezone.now() + timedelta(minutes=expires_in_minutes)
        return OTP.objects.create(
            identifier=identifier,
            code=code,
            otp_type=otp_type,
            purpose=purpose,
            expires_at=expires_at
        )
