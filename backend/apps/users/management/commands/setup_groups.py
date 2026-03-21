"""
Django management command to set up groups and permissions.
This command creates all the groups and assigns permissions based on the permission structure.

Usage:
    python manage.py setup_groups
    python manage.py setup_groups --reset  # Reset and recreate all groups
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission, ContentType
from apps.users.permissions import (
    PERMISSIONS, 
    GROUP_PERMISSIONS_MAP, 
    ALL_GROUPS,
    get_all_permissions,
    get_group_permissions,
)


class Command(BaseCommand):
    help = "Set up groups and permissions for role-based access control"

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Reset and recreate all groups and permissions',
        )

    def handle(self, *args, **options):
        reset = options.get('reset', False)

        self.stdout.write(self.style.SUCCESS('🚀 Starting Groups and Permissions Setup...'))

        try:
            # Step 1: Create or get ContentType for all permission apps
            self.stdout.write('\n📋 Step 1: Setting up ContentTypes and Permissions...')
            self._setup_permissions()

            # Step 2: Create or reset groups
            self.stdout.write('\n👥 Step 2: Setting up Groups...')
            if reset:
                self._reset_groups()
            self._create_groups()

            # Step 3: Assign permissions to groups
            self.stdout.write('\n🔐 Step 3: Assigning Permissions to Groups...')
            self._assign_permissions_to_groups()

            # Step 4: Display summary
            self.stdout.write('\n📊 Step 4: Summary...')
            self._display_summary()

            self.stdout.write(self.style.SUCCESS('\n✅ Setup completed successfully!'))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n❌ Error: {str(e)}'))
            raise

    def _setup_permissions(self):
        """Create permission objects for all app labels."""
        for app_label, perm_dict in PERMISSIONS.items():
            # Create or get ContentType
            content_type, created = ContentType.objects.get_or_create(app_label=app_label)
            
            for codename, name in perm_dict.items():
                perm, created = Permission.objects.get_or_create(
                    content_type=content_type,
                    codename=codename,
                    defaults={'name': name}
                )
                if created:
                    self.stdout.write(f'  ✓ Created permission: {app_label}.{codename}')
                else:
                    # Update name if it changed
                    if perm.name != name:
                        perm.name = name
                        perm.save()
                        self.stdout.write(f'  ✓ Updated permission: {app_label}.{codename}')

    def _reset_groups(self):
        """Delete all existing groups."""
        for group_name in ALL_GROUPS:
            Group.objects.filter(name=group_name).delete()
            self.stdout.write(f'  ✓ Deleted group: {group_name}')

    def _create_groups(self):
        """Create all groups."""
        for group_name in ALL_GROUPS:
            group, created = Group.objects.get_or_create(name=group_name)
            if created:
                self.stdout.write(f'  ✓ Created group: {group_name}')
            else:
                self.stdout.write(f'  • Group already exists: {group_name}')

    def _assign_permissions_to_groups(self):
        """Assign permissions to each group based on the mapping."""
        for group_name, permission_tuples in GROUP_PERMISSIONS_MAP.items():
            group = Group.objects.get(name=group_name)
            
            # Clear existing permissions
            group.permissions.clear()
            
            # Add permissions
            for app_label, codename in permission_tuples:
                try:
                    permission = Permission.objects.get(
                        content_type__app_label=app_label,
                        codename=codename
                    )
                    group.permissions.add(permission)
                except Permission.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ⚠ Permission not found: {app_label}.{codename}'
                        )
                    )
            
            self.stdout.write(
                f'  ✓ Assigned {group.permissions.count()} permissions to {group_name}'
            )

    def _display_summary(self):
        """Display summary of all groups and their permissions."""
        self.stdout.write('\n' + '='*80)
        self.stdout.write('GROUPS CONFIGURATION SUMMARY'.center(80))
        self.stdout.write('='*80)

        for group_name in ALL_GROUPS:
            group = Group.objects.get(name=group_name)
            permissions = group.permissions.all()
            
            self.stdout.write(f'\n👤 {group_name.upper()}')
            self.stdout.write(f'   Total Permissions: {permissions.count()}')
            self.stdout.write('   Permissions:')
            
            perms_by_app = {}
            for perm in permissions:
                app_label = perm.content_type.app_label
                if app_label not in perms_by_app:
                    perms_by_app[app_label] = []
                perms_by_app[app_label].append(perm.codename)
            
            for app_label in sorted(perms_by_app.keys()):
                self.stdout.write(f'     • {app_label}:')
                for codename in sorted(perms_by_app[app_label]):
                    self.stdout.write(f'       - {codename}')

        self.stdout.write('\n' + '='*80)
