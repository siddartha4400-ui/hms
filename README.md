# HMS - Hotel Management System

A full-stack multi-tenant hotel management system built with Django, Next.js, GraphQL, and WebSockets.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 6, Django REST Framework, Graphene-Django |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS v4 |
| Database | PostgreSQL 16 with django-tenants (schema isolation) |
| Auth | JWT via django-graphql-jwt |
| API | GraphQL (primary), REST (secondary) |
| Real-time | Django Channels (WebSocket) |
| Task Queue | Celery + Redis |
| DevOps | Docker Compose |

## Features

### Authentication & Authorization
- JWT-based login and registration via GraphQL
- Token stored in cookies with auto-refresh support
- Role-based access control (RBAC) with 4 roles:
  - **Admin** - Full system access, user management
  - **Manager** - Room CRUD, booking management
  - **Staff** - Create bookings, manage guests, update statuses
  - **Guest** - View-only access
- Protected frontend routes with automatic redirect to login
- GraphQL decorator-based permission enforcement (`@admin_required`, `@manager_required`, `@staff_required`)

### Multi-Tenancy
- Subdomain-based tenant isolation using django-tenants
- Separate PostgreSQL schemas per tenant
- Shared user and tenant models in public schema
- Custom tenant middleware for request routing

### Dashboard
- Real-time statistics: total rooms, available, booked, maintenance
- Active and pending booking counts
- Recent bookings list with guest and room details
- Room status overview with visual progress bars

### Room Inventory Management
- Hierarchical structure: Location > Building > Floor > Room
- Room attributes: number, type, capacity, base price, status
- Status management: Available, Booked, Maintenance
- Filter rooms by status
- Inline status editing from the rooms table
- Unique constraints: room number per building, floor number per building

### Booking Management
- Create bookings with guest, room, dates, price, and notes
- Automatic overlap detection (prevents double-booking)
- Status workflow: Pending > Confirmed > Checked In > Checked Out
- Cancellation support (frees the room)
- Filter bookings by status
- Quick status update dropdown on each booking card

### Guest Management
- Guest records with name, email, phone, and verification status
- Create guests inline when making a booking
- Unique email constraint
- Guest listing with verification badges

### Real-time Features (WebSocket)
- Django Channels consumers for bookings and dashboard
- Automatic broadcast on booking create/update via Django signals
- Frontend `useWebSocket` hook for consuming live updates
- Dashboard auto-refresh on booking changes

### Celery Background Tasks
- `send_booking_confirmation` - Email notification on booking confirmation
- `send_checkout_reminder` - Reminder email before checkout date
- `check_expired_bookings` - Auto-cancel overdue pending bookings
- Celery Beat for scheduled task execution

### GraphQL API

**Queries:**

| Query | Description | Auth |
|-------|-------------|------|
| `me` | Current user profile (id, username, email, role) | Login required |
| `users` | List all users | Login required |
| `allRooms(status)` | List rooms with optional status filter | Login required |
| `room(id)` | Get single room details | Login required |
| `allLocations` | List all locations | Login required |
| `allBuildings(locationId)` | List buildings, optionally by location | Login required |
| `allFloors(buildingId)` | List floors, optionally by building | Login required |
| `allGuests` | List all guests | Login required |
| `guest(id)` | Get single guest | Login required |
| `allBookings(status)` | List bookings with optional status filter | Login required |
| `booking(id)` | Get single booking | Login required |
| `dashboardStats` | Aggregated stats (rooms, bookings, guests) | Login required |

**Mutations:**

| Mutation | Description | Auth |
|----------|-------------|------|
| `tokenAuth` | Login, returns JWT + refresh token | Public |
| `verifyToken` | Verify JWT validity | Public |
| `refreshToken` | Refresh expired JWT | Public |
| `createUser` | Register new user | Public |
| `createRoom` | Add a new room | Manager+ |
| `updateRoom` | Update room type/capacity/price/status | Manager+ |
| `createGuest` | Add a new guest | Staff+ |
| `createBooking` | Create a booking (with overlap check) | Staff+ |
| `updateBookingStatus` | Change booking status | Staff+ |

### REST API (Secondary)

| Endpoint | Methods | Description |
|----------|---------|-------------|
| `/api/tenants/` | CRUD | Tenant management |
| `/api/rooms/` | CRUD | Room inventory |
| `/api/users/` | CRUD | User management |
| `/api/bookings/` | CRUD | Booking management |

### Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Auto-redirect to `/dashboard` or `/login` |
| `/login` | Login form with error handling |
| `/register` | Registration with password confirmation |
| `/dashboard` | Stats cards, recent bookings, room overview |
| `/dashboard/rooms` | Room table with filters and inline editing |
| `/dashboard/bookings` | Booking cards with create form and status updates |
| `/dashboard/guests` | Guest table with add form |

## Project Structure

```
hms/
├── backend/
│   ├── config/              # Django project settings
│   │   ├── settings.py      # Multi-tenancy, CORS, JWT, Celery config
│   │   ├── schema.py        # GraphQL schema (queries + mutations)
│   │   ├── urls.py          # REST + GraphQL routing
│   │   ├── asgi.py          # ASGI + Channels routing
│   │   ├── routing.py       # WebSocket URL patterns
│   │   └── celery.py        # Celery app configuration
│   ├── tenants/             # Tenant & Domain models
│   ├── users/               # User model, permissions, tests
│   │   └── permissions.py   # Role-based decorators
│   ├── inventory/           # Location, Building, Floor, Room models
│   ├── bookings/            # Guest, Booking models, signals, tasks
│   │   ├── consumers.py     # WebSocket consumers
│   │   ├── signals.py       # Booking change broadcasts
│   │   └── tasks.py         # Celery async tasks
│   ├── middleware/           # Custom tenant middleware
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── app/
│   │   ├── layout.tsx              # Root layout with Apollo + Auth providers
│   │   ├── page.tsx                # Auto-redirect
│   │   ├── login/page.tsx          # Login page
│   │   ├── register/page.tsx       # Registration page
│   │   └── dashboard/
│   │       ├── layout.tsx          # Protected layout with sidebar + header
│   │       ├── page.tsx            # Dashboard with stats
│   │       ├── rooms/page.tsx      # Room management
│   │       ├── bookings/page.tsx   # Booking management
│   │       └── guests/page.tsx     # Guest management
│   ├── components/
│   │   ├── sidebar.tsx             # Navigation sidebar
│   │   └── header.tsx              # Top bar with user + logout
│   ├── lib/
│   │   ├── apollo-client.ts        # Apollo Client with JWT auth
│   │   ├── apollo-provider.tsx     # ApolloProvider wrapper
│   │   ├── auth-context.tsx        # Auth state (user, role, login, logout)
│   │   ├── use-websocket.ts        # WebSocket hook
│   │   └── graphql/
│   │       ├── auth.ts             # Auth queries/mutations
│   │       ├── rooms.ts            # Room queries/mutations
│   │       └── bookings.ts         # Booking/guest/stats queries/mutations
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml               # PostgreSQL, Redis, backend, celery, frontend
```

## Getting Started

### Local Development

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Set up PostgreSQL
createdb hms
DATABASE_URL=postgresql://<your-user>@localhost:5432/hms python manage.py migrate

# Create admin user
DATABASE_URL=postgresql://<your-user>@localhost:5432/hms python manage.py createsuperuser

# Create public tenant (required for localhost access)
DATABASE_URL=postgresql://<your-user>@localhost:5432/hms python -c "
import django, os
os.environ['DJANGO_SETTINGS_MODULE'] = 'config.settings'
django.setup()
from tenants.models import Tenant, Domain
tenant = Tenant(schema_name='public', name='Public', subdomain='public')
tenant.save()
Domain.objects.create(domain='localhost', tenant=tenant, is_primary=True)
"

# Start backend
DATABASE_URL=postgresql://<your-user>@localhost:5432/hms python manage.py runserver 8000

# Frontend (in another terminal)
cd frontend
npm install
npm run dev
```

### Docker

```bash
docker-compose up --build -d
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

### Production

For production deployment, use a process manager:

```bash
# Using Uvicorn (ASGI server for WebSocket support)
uvicorn config.asgi:application --host 0.0.0.0 --port 8000 --workers 4
```

Or with systemd:

```ini
[Unit]
Description=HMS Django ASGI Server
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/hms/backend
ExecStart=/home/ubuntu/hms/backend/venv/bin/uvicorn config.asgi:application \
    --host 0.0.0.0 --port 8000 --workers 4
Restart=always

[Install]
WantedBy=multi-user.target
```

WebSocket connection from frontend:
```javascript
// Development
const socket = new WebSocket("ws://localhost:8000/ws/bookings/");

// Production (with HTTPS)
const socket = new WebSocket("wss://yourdomain.com/ws/bookings/");
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://postgres:password@postgres:5432/hms` | PostgreSQL connection |
| `REDIS_URL` | `redis://redis:6379/0` | Redis for Celery broker |
| `DJANGO_SECRET_KEY` | (hardcoded dev key) | Django secret key |
| `DEBUG` | `True` | Debug mode |
| `NEXT_PUBLIC_GRAPHQL_URL` | `http://localhost:8000/graphql/` | GraphQL endpoint |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8000` | WebSocket endpoint |
| `EMAIL_HOST` | - | SMTP host for email notifications |
| `EMAIL_PORT` | - | SMTP port |
| `EMAIL_HOST_USER` | - | SMTP username |
| `EMAIL_HOST_PASSWORD` | - | SMTP password |

## Docker Services

| Service | Port | Description |
|---------|------|-------------|
| `postgres` | 5432 | PostgreSQL 16 database |
| `redis` | 6379 | Redis for Celery broker |
| `backend` | 8000 | Django development server |
| `celery` | - | Celery worker for async tasks |
| `celery-beat` | - | Celery Beat for scheduled tasks |
| `frontend` | 3000 | Next.js development server |

## Tests

```bash
cd backend
source venv/bin/activate
DATABASE_URL=postgresql://<your-user>@localhost:5432/hms python manage.py test
```

Test coverage includes:
- **User model tests** - Creation, roles, default values, string representation
- **Inventory model tests** - Hierarchy (Location > Building > Floor > Room), uniqueness constraints
- **Booking model tests** - Creation, status workflow, ordering
- **Permission tests** - Role-based decorator enforcement, unauthenticated user blocking
