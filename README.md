# HMS - Hotel Management System

A full-stack multi-tenant hotel management system built with Django, Next.js, GraphQL, and WebSockets. Each hotel runs as an isolated subsite with its own data, users, rooms, bookings, and guests — all powered by a single codebase and single database.

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
| Multi-Tenancy | django-tenants (subdomain-based, PostgreSQL schema isolation) |
| DevOps | Docker Compose |

## Features

### Authentication & Authorization
- JWT-based login and registration via GraphQL
- Token stored in cookies with auto-refresh support
- Role-based access control (RBAC) with 4 roles:
  - **Admin** - Full system access, user management, hotel (tenant) creation
  - **Manager** - Room CRUD, booking management
  - **Staff** - Create bookings, manage guests, update statuses
  - **Guest** - View-only access
- Protected frontend routes with automatic redirect to login
- GraphQL decorator-based permission enforcement (`@admin_required`, `@manager_required`, `@staff_required`)

### Multi-Tenancy (Hotel Subsites)

This is the core architecture of HMS. Each hotel runs as a completely isolated subsite.

#### How It Works

```
Single PostgreSQL Database: "hms"
├── public schema     ← Shared: tenants, domains, public users
├── grand schema      ← Hotel Grand: its own rooms, bookings, guests, users
├── sunrise schema    ← Hotel Sunrise: its own rooms, bookings, guests, users
└── oceanview schema  ← Hotel Oceanview: its own rooms, bookings, guests, users
```

**No separate databases needed.** django-tenants uses PostgreSQL schemas within one database to achieve complete data isolation.

#### Request Flow (Step by Step)

When a browser visits `http://grand.localtest.me:8000/graphql/`:

```
Step 1: DNS Resolution
   grand.localtest.me → 127.0.0.1
   (localtest.me is a free service that points all subdomains to 127.0.0.1)

Step 2: Django Tenant Middleware
   ┌─────────────────────────────────────────────┐
   │ 1. Reads hostname: "grand.localtest.me"     │
   │ 2. Queries: Domain.objects.get(             │
   │      domain="grand.localtest.me")           │
   │ 3. Finds tenant: grand (schema="grand")     │
   │ 4. Sets: connection.set_tenant(tenant)      │
   │    → PostgreSQL runs: SET search_path=grand  │
   └─────────────────────────────────────────────┘

Step 3: All Database Queries Hit the Tenant's Schema
   Room.objects.all()    → SELECT * FROM grand.inventory_room
   Booking.objects.all() → SELECT * FROM grand.bookings_booking
   Guest.objects.all()   → SELECT * FROM grand.bookings_guest

   NOT public.inventory_room — each tenant's data is completely separate.
```

#### Frontend Tenant Routing

The frontend dynamically detects which tenant the user is on:

```
Browser at: http://grand.localtest.me:3000

  apollo-client.ts → getGraphQLUri()
    window.location.hostname = "grand.localtest.me"
    GraphQL URI = http://grand.localtest.me:8000/graphql/
                                    ↓
  Backend receives Host: grand.localtest.me
    → Tenant middleware activates "grand" schema
    → Returns only Hotel Grand's data
```

#### What's Shared vs What's Isolated

| Shared (public schema) | Isolated (per-tenant schema) |
|---|---|
| `tenants_tenant` — list of all hotels | `inventory_location` — hotel's locations |
| `tenants_domain` — hostname mappings | `inventory_building` — hotel's buildings |
| | `inventory_floor` — hotel's floors |
| | `inventory_room` — hotel's rooms |
| | `bookings_booking` — hotel's bookings |
| | `bookings_guest` — hotel's guests |
| | `users_user` — hotel's staff accounts |

#### Data Isolation Example

If Hotel Grand has 50 rooms and Hotel Sunrise has 10 rooms:

```
http://grand.localtest.me:8000    → schema=grand    → allRooms returns 50 rooms
http://sunrise.localtest.me:8000  → schema=sunrise  → allRooms returns 10 rooms
http://localhost:8000             → schema=public   → allRooms returns 0 rooms
```

They can never see each other's data because PostgreSQL schemas are completely separate namespaces.

#### Creating a New Hotel (Subsite)

**Option 1: From the UI (Admin only)**

1. Log in at `http://localhost:3000` as an admin user
2. Go to **Dashboard → Hotels** (`/dashboard/hotels`)
3. Click **"+ New Hotel"**
4. Fill in:
   - **Hotel Name** — e.g., "Beach Resort"
   - **Subdomain** — e.g., "beach" (becomes `beach.localtest.me`)
   - **Admin Username** — admin account for the new hotel
   - **Admin Password** — password for the admin account
   - **Admin Email** (optional)
5. Click **"Create Hotel"**

What happens behind the scenes:

```
1. Creates PostgreSQL schema "beach"
2. Runs ALL migrations in the new schema
   (creates inventory_room, bookings_booking, etc.)
3. Registers domain "beach.localtest.me" → tenant "beach"
4. Creates admin user inside the "beach" schema
5. Hotel is immediately accessible at:
   Frontend: http://beach.localtest.me:3000
   Backend:  http://beach.localtest.me:8000
```

**Option 2: From the command line**

```bash
# Using django-tenants built-in command
python manage.py create_tenant \
  --schema_name beach \
  --name "Beach Resort" \
  --subdomain beach \
  --domain-domain beach.localtest.me \
  --domain-is_primary True \
  --noinput

# Create an admin user for the new tenant
python manage.py tenant_command createsuperuser --schema=beach
```

**Option 3: From Django shell**

```python
from tenants.models import Tenant, Domain

tenant = Tenant(schema_name='beach', name='Beach Resort', subdomain='beach')
tenant.save()  # Creates schema + runs migrations

Domain.objects.create(domain='beach.localtest.me', tenant=tenant, is_primary=True)
```

#### Accessing a Hotel Subsite

After creating a hotel with subdomain "beach":

| URL | What you see |
|-----|-------------|
| `http://beach.localtest.me:3000` | Beach Resort's frontend (login page) |
| `http://beach.localtest.me:8000/graphql/` | Beach Resort's GraphQL API |
| `http://beach.localtest.me:8000/admin/` | Beach Resort's Django admin |

Log in with the admin credentials you set when creating the hotel.

#### How localtest.me Works

`localtest.me` is a free public DNS service where **all subdomains resolve to 127.0.0.1**:

```
beach.localtest.me     → 127.0.0.1
grand.localtest.me     → 127.0.0.1
anything.localtest.me  → 127.0.0.1
```

No `/etc/hosts` editing needed. It just works for local development.

#### Multi-Tenancy Architecture Summary

| Component | File | Role |
|---|---|---|
| Tenant model | `tenants/models.py` | Stores hotel info + PostgreSQL schema name |
| Domain model | `tenants/models.py` | Maps hostname → tenant |
| Tenant middleware | `middleware/` | Reads hostname, finds tenant, sets `search_path` |
| Apollo Client | `frontend/lib/apollo-client.ts` | Uses `window.location.hostname` so requests go to correct tenant |
| CORS config | `backend/config/settings.py` | Regex allows all `*.localtest.me` origins |
| `schema_context()` | django-tenants utility | Run queries in a specific tenant's schema |
| CreateTenant mutation | `backend/config/schema.py` | Creates schema + domain + admin user via GraphQL |

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
- Status workflow: Pending → Confirmed → Checked In → Checked Out
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
| `allTenants` | List all hotel subsites | Login required |

**Mutations:**

| Mutation | Description | Auth |
|----------|-------------|------|
| `tokenAuth` | Login, returns JWT + refresh token | Public |
| `verifyToken` | Verify JWT validity | Public |
| `refreshToken` | Refresh expired JWT | Public |
| `createUser` | Register new user | Public |
| `createTenant` | Create a new hotel subsite (schema + domain + admin) | Admin only |
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
| `/dashboard/hotels` | Hotel subsite management (create, list) — Admin only |

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
│   │   └── management/      # Management commands
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
│   │   ├── error.tsx               # Error boundary
│   │   ├── global-error.tsx        # Global error boundary
│   │   └── dashboard/
│   │       ├── layout.tsx          # Protected layout with sidebar + header
│   │       ├── page.tsx            # Dashboard with stats
│   │       ├── rooms/page.tsx      # Room management
│   │       ├── bookings/page.tsx   # Booking management
│   │       ├── guests/page.tsx     # Guest management
│   │       └── hotels/page.tsx     # Hotel subsite management
│   ├── components/
│   │   ├── sidebar.tsx             # Navigation sidebar
│   │   └── header.tsx              # Top bar with user + logout
│   ├── lib/
│   │   ├── apollo-client.ts        # Apollo Client with JWT auth + tenant routing
│   │   ├── apollo-provider.tsx     # ApolloProvider wrapper
│   │   ├── auth-context.tsx        # Auth state (user, role, login, logout)
│   │   ├── use-websocket.ts        # WebSocket hook
│   │   └── graphql/
│   │       ├── auth.ts             # Auth queries/mutations
│   │       ├── rooms.ts            # Room queries/mutations
│   │       ├── bookings.ts         # Booking/guest/stats queries/mutations
│   │       └── tenants.ts          # Tenant queries/mutations
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

### Creating Your First Hotel Subsite

After setup, log in at `http://localhost:3000` and go to **Hotels** page, or use the CLI:

```bash
# Create a hotel
DATABASE_URL=postgresql://<your-user>@localhost:5432/hms python manage.py create_tenant \
  --schema_name grand \
  --name "Hotel Grand" \
  --subdomain grand \
  --domain-domain grand.localtest.me \
  --domain-is_primary True \
  --noinput

# Create admin for the hotel
DATABASE_URL=postgresql://<your-user>@localhost:5432/hms python manage.py tenant_command createsuperuser --schema=grand

# Access at: http://grand.localtest.me:3000
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

For production multi-tenancy, use real domains:

```
hotel-grand.yourdomain.com → Tenant "grand"
hotel-sunrise.yourdomain.com → Tenant "sunrise"
```

Register each domain in the Domain model pointing to the correct tenant.

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
| `NEXT_PUBLIC_GRAPHQL_URL` | `http://localhost:8000/graphql/` | GraphQL endpoint (fallback) |
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

## Services Diagram

```
Browser (subdomain.localtest.me:3000)
    │
    ├── GraphQL ──▶ Django (subdomain.localtest.me:8000/graphql/)
    │                  │
    │                  ├── Tenant Middleware → SET search_path = <tenant>
    │                  ├── PostgreSQL (localhost:5432) → Tenant's schema
    │                  ├── Redis (localhost:6379)
    │                  └── Channels (WebSocket ws://localhost:8000/ws/)
    │
    └── WebSocket ──▶ Django Channels
                         └── Broadcasts booking updates
```
