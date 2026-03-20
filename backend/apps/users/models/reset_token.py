"""Password reset token model for secure password recovery."""
from django.db import models
from django.contrib.auth.models import User as DjangoUser
from django.utils import timezone
from datetime import timedelta
import secrets


class PasswordResetToken(models.Model):
    """Secure password reset token model."""
    
    # User reference
    user = models.OneToOneField(DjangoUser, on_delete=models.CASCADE, related_name='reset_token')
    
    # Token
    token = models.CharField(max_length=255, unique=True, db_index=True)
    
    # Expiry
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(db_index=True)
    is_used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'password_reset_tokens'
        app_label = 'users'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Reset token for {self.user.email}"
    
    def is_expired(self):
        """Check if token has expired."""
        return timezone.now() > self.expires_at
    
    def is_valid(self):
        """Check if token is valid (not expired and not used)."""
        return not self.is_expired() and not self.is_used
    
    def mark_used(self):
        """Mark token as used."""
        self.is_used = True
        self.used_at = timezone.now()
        self.save()
    
    @staticmethod
    def create_token(user, expires_in_hours=24):
        """Factory method to create password reset token."""
        # Delete existing token if any
        PasswordResetToken.objects.filter(user=user).delete()
        
        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=expires_in_hours)
        return PasswordResetToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )
