# Contributing to HMS

## First-Time Setup (New Developer)

### Option A: Docker (Recommended - No local installs needed)

```bash
# 1. Clone the repo
git clone https://github.com/siddartha4400-ui/hms.git
cd hms

# 2. Start all services
docker-compose up --build -d

# 3. Run database migrations
docker-compose exec backend python manage.py migrate

# 4. Create public tenant (required for localhost to work)
docker-compose exec backend python -c "
import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()
from tenants.models import Tenant, Domain
tenant = Tenant(schema_name='public', name='Public', subdomain='public')
tenant.save()
Domain.objects.create(domain='localhost', tenant=tenant, is_primary=True)
print('Done!')
"

# 5. Create admin user
docker-compose exec backend python manage.py createsuperuser
# Enter: username, email, password when prompted

# 6. Access the app
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# GraphiQL: http://localhost:8000/graphql/
```

### Option B: Local Development (Without Docker)

**Prerequisites:**
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Redis (optional, needed for Celery tasks)

```bash
# 1. Clone the repo
git clone https://github.com/siddartha4400-ui/hms.git
cd hms

# 2. Backend setup
cd backend
python3 -m venv venv
source venv/bin/activate      # macOS/Linux
# venv\Scripts\activate       # Windows
pip install -r requirements.txt

# 3. Create PostgreSQL database
createdb hms

# 4. Set your database URL (replace YOUR_USERNAME with your PostgreSQL user)
export DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/hms

# 5. Run migrations
python manage.py migrate

# 6. Create public tenant
python -c "
import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()
from tenants.models import Tenant, Domain
tenant = Tenant(schema_name='public', name='Public', subdomain='public')
tenant.save()
Domain.objects.create(domain='localhost', tenant=tenant, is_primary=True)
print('Done!')
"

# 7. Create admin user
python manage.py createsuperuser

# 8. Start backend
python manage.py runserver 8000

# 9. Frontend setup (new terminal)
cd ../frontend
npm install
npm run dev

# 10. Access the app
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
```

## Working on Features

### Branch Naming Convention

```
feature/your-feature-name
bugfix/issue-description
```

### Project Architecture

```
Backend (Django):
  config/schema.py    - GraphQL queries & mutations (main API)
  config/urls.py      - REST API routes
  config/settings.py  - All configuration

  users/              - User model + permissions
  inventory/          - Location > Building > Floor > Room
  bookings/           - Guest + Booking models, tasks, signals
  tenants/            - Multi-tenancy models

Frontend (Next.js):
  app/                - Pages (file-based routing)
  components/         - Reusable UI components
  lib/graphql/        - GraphQL queries & mutations
  lib/auth-context    - Authentication state
  lib/apollo-client   - API client configuration
```

### Adding a New Feature (Example: Add "Room Types" Management)

**1. Backend - Add/modify models:**
```python
# inventory/models.py
class RoomType(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
```

**2. Create & run migrations:**
```bash
python manage.py makemigrations
python manage.py migrate
```

**3. Add GraphQL queries/mutations in `config/schema.py`:**
```python
class RoomTypeType(DjangoObjectType):
    class Meta:
        model = RoomType

# Add to Query class:
all_room_types = graphene.List(RoomTypeType)

def resolve_all_room_types(self, info):
    return RoomType.objects.all()
```

**4. Add frontend GraphQL query in `lib/graphql/rooms.ts`:**
```typescript
export const ALL_ROOM_TYPES = gql`
  query AllRoomTypes {
    allRoomTypes { id name description }
  }
`;
```

**5. Create frontend page at `app/dashboard/room-types/page.tsx`**

**6. Add navigation link in `components/sidebar.tsx`**

### Important Notes

#### Apollo Client v4
- Import hooks from `@apollo/client/react` (NOT `@apollo/client`)
- Import `gql` from `@apollo/client`
- Always add type parameters: `useQuery<{ allRooms: Room[] }>(ALL_ROOMS)`

#### Multi-Tenancy
- The `localhost` domain MUST have a public tenant registered
- Without it, all requests return 404 ("No tenant for hostname")
- New domains need a Tenant + Domain entry in the database

#### Permissions
- Use decorators from `users/permissions.py`:
  - `@login_required` - Any authenticated user
  - `@staff_required` - Admin, Manager, or Staff
  - `@manager_required` - Admin or Manager
  - `@admin_required` - Admin only

#### Running Tests
```bash
cd backend
source venv/bin/activate
DATABASE_URL=postgresql://YOUR_USERNAME@localhost:5432/hms python manage.py test
```

### Common Issues

| Issue | Solution |
|-------|----------|
| `No tenant for hostname "localhost"` | Create public tenant (see setup step 6) |
| `relation "refresh_token_refreshtoken" does not exist` | Run `python manage.py migrate` |
| CORS errors / "Failed to fetch" | Check frontend port is in `CORS_ALLOWED_ORIGINS` in settings.py |
| `role "postgres" does not exist` | Use your local DB username in DATABASE_URL |
| Port 3000 in use | Frontend auto-picks next port (3001), add it to CORS_ALLOWED_ORIGINS |

### Services Diagram

```
Browser (localhost:3000)
    │
    ├── GraphQL ──▶ Django (localhost:8000/graphql/)
    │                  ├── PostgreSQL (localhost:5432)
    │                  ├── Redis (localhost:6379)
    │                  └── Channels (WebSocket ws://localhost:8000/ws/)
    │
    └── WebSocket ──▶ Django Channels
                         └── Broadcasts booking updates
```
