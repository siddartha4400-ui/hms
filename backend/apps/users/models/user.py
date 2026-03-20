"""User model that extends Django's default auth.User."""
from django.db import models
from django.contrib.auth.models import User as DjangoUser
from core.base_model import BaseModel as CoreBaseModel


ROLE_CHOICES = [
    (0, "Normal User"),
    (1, "Site Admin"),
    (2, "Site Manager"),
]


class User(CoreBaseModel):
    """Extended user model with additional fields beyond Django's auth.User."""
    
    # Foreign key to Django's auth.User (one-to-one relationship)
    auth_user = models.OneToOneField(DjangoUser, on_delete=models.CASCADE, related_name='profile')
    
    # Contact Information
    mobile_number = models.CharField(max_length=20, unique=True, db_index=True)
    
    # Role Management
    role = models.IntegerField(choices=ROLE_CHOICES, default=0, null=True, blank=True)
    
    # Address Information
    address_line1 = models.CharField(max_length=255, blank=True, null=True)
    address_line2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    
    # Company Reference
    company_id = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    
    # Audit Fields
    created_by = models.ForeignKey(
        DjangoUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='created_users'
    )
    updated_by = models.ForeignKey(
        DjangoUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='updated_users'
    )
    
    # Profile Picture Reference (Foreign key to attachments)
    profile_id = models.BigIntegerField(null=True, blank=True, db_index=True)
    
    # Date of Birth
    dob = models.DateTimeField(null=True, blank=True)
    
    # Account Status
    is_verified = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'users'
        app_label = 'users'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['mobile_number']),
            models.Index(fields=['company_id']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.auth_user.email} ({self.mobile_number})"
    
    @property
    def email(self):
        return self.auth_user.email
    
    @property
    def username(self):
        return self.auth_user.username
    
    @property
    def first_name(self):
        return self.auth_user.first_name
    
    @property
    def last_name(self):
        return self.auth_user.last_name
