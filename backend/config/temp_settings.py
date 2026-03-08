# Temporary settings for makemigrations without tenant router
from .settings import *

# Remove django_tenants from INSTALLED_APPS
INSTALLED_APPS = [app for app in INSTALLED_APPS if app != 'django_tenants']
SHARED_APPS = [app for app in SHARED_APPS if app != 'django_tenants']
# Keep tenants for migration

DATABASE_ROUTERS = []  # disable for makemigrations
DATABASES['default']['ENGINE'] = 'django.db.backends.postgresql'
