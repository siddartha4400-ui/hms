# HMS - Complete Project Guide

## What Is This Project?

HMS is a **Hotel Management System** — a web application that lets hotel owners and staff manage their hotels digitally. Think of it as software that replaces paper registers, spreadsheets, and manual booking systems.

### Who Uses It?

| User | What They Do |
|------|-------------|
| **Hotel Owner (Admin)** | Creates hotel subsites, manages staff accounts, full system control |
| **Manager** | Adds rooms, sets prices, manages inventory |
| **Staff (Front Desk)** | Creates bookings, checks in/out guests, manages guest records |
| **Guest** | Views their booking details (read-only access) |

### What Problems Does It Solve?

```
WITHOUT HMS                          WITH HMS
──────────                           ────────
Paper booking register               Digital booking system
  → Lost bookings                      → Never lose a booking
  → Double bookings                    → Automatic overlap detection
  → No search capability               → Filter by status, date, guest

Spreadsheet room tracking            Room inventory management
  → Manual updates                     → Real-time status updates
  → No status tracking                 → Available / Booked / Maintenance
  → No price management                → Per-room pricing

Phone/email for staff                Role-based dashboard
  → No access control                  → Each role sees what they need
  → No audit trail                     → All actions tracked
  → Manual coordination                → Real-time updates via WebSocket

One hotel = one system               Multi-tenant architecture
  → New hotel = new server             → New hotel = click a button
  → Separate databases                 → One database, isolated schemas
  → Separate deployments               → One deployment serves all hotels
```

---

## How to Use This Project (User Guide)

### Step 1: Login

Go to `http://localhost:3000` → You'll see the login page.

```
Username: admin
Password: admin123
```

### Step 2: Dashboard (`/dashboard`)

After login, you see the dashboard with:

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total Rooms │  Available  │   Booked    │ Maintenance │
│     25      │     18      │      5      │      2      │
└─────────────┴─────────────┴─────────────┴─────────────┘

┌─────────────────────────────────────────────────────────┐
│ Recent Bookings                                         │
│ ┌─────────┬──────────┬────────┬───────────┬──────────┐ │
│ │ Guest   │ Room     │ Dates  │ Status    │ Price    │ │
│ │ John    │ 101      │ Mar 8  │ Confirmed │ $250     │ │
│ │ Sarah   │ 205      │ Mar 9  │ Pending   │ $180     │ │
│ └─────────┴──────────┴────────┴───────────┴──────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Step 3: Manage Rooms (`/dashboard/rooms`)

Create and manage your hotel's room inventory:

```
1. First create the hierarchy:
   Location (City/Area) → Building (Wing/Block) → Floor (1st, 2nd...) → Room

2. Add rooms with:
   - Room number (e.g., "101")
   - Type (Single, Double, Suite)
   - Capacity (1-4 persons)
   - Base price ($100/night)
   - Status (Available, Booked, Maintenance)

3. Filter rooms by status
4. Edit room status inline from the table
```

### Step 4: Manage Guests (`/dashboard/guests`)

Add guest records:

```
- Name: John Smith
- Email: john@email.com (unique per guest)
- Phone: +1-555-0123
```

### Step 5: Create Bookings (`/dashboard/bookings`)

Book a room for a guest:

```
1. Select guest (or create new inline)
2. Select room
3. Pick check-in date
4. Pick check-out date
5. Set total price
6. Add notes (optional)
7. Click "Create Booking"

The system automatically:
  ✓ Checks for date overlaps (prevents double-booking)
  ✓ Marks the room as "Booked"
  ✓ Shows the booking in the dashboard
```

Booking status flow:

```
Pending → Confirmed → Checked In → Checked Out
                   ↘ Cancelled (frees the room)
```

### Step 6: Create Hotel Subsites (`/dashboard/hotels`) — Admin Only

Create a completely new hotel with its own isolated data:

```
1. Click "+ New Hotel"
2. Fill in:
   - Hotel Name: "Beach Resort"
   - Subdomain: "beach"
   - Admin Username: "admin"
   - Admin Password: "beach123"
3. Click "Create Hotel"

Result:
  → New hotel live at: http://beach.localtest.me:3000
  → Has its own rooms, bookings, guests, users
  → Completely separate from other hotels
```

---

## Why GraphQL? (Instead of REST API)

### The Problem with REST

Imagine you're building the Dashboard page. You need:
- User info (name, role)
- Room counts (total, available, booked, maintenance)
- Recent bookings with guest names and room numbers
- Booking stats

With a **REST API**, you'd need multiple requests:

```
REST (Multiple Requests):

GET /api/users/me/              → { username, email, role }
GET /api/rooms/?status=available → [room1, room2, ...]
GET /api/rooms/?status=booked    → [room3, room4, ...]
GET /api/bookings/?limit=5       → [booking1, booking2, ...]
GET /api/stats/dashboard/        → { total_rooms: 25, ... }

= 5 HTTP requests
= 5 round trips to server
= Slow page load
= Each response includes ALL fields (even ones you don't need)
```

### The GraphQL Solution

With **GraphQL**, you send ONE request and ask for exactly what you need:

```graphql
# ONE request gets everything:

query {
  me {
    username
    role
  }
  dashboardStats
  allBookings(status: "confirmed") {
    id
    guest { name }
    room { number }
    checkIn
    checkOut
    totalPrice
  }
}
```

```
GraphQL (Single Request):

POST /graphql/
  Body: { query: "..." }

→ Returns EXACTLY the fields you asked for
→ 1 HTTP request
→ 1 round trip
→ No over-fetching (no extra fields)
→ No under-fetching (everything in one go)
```

### REST vs GraphQL Comparison

```
Feature              REST                    GraphQL
─────────────        ────                    ───────
Endpoints            Many (/api/rooms/,      One (/graphql/)
                     /api/bookings/, etc.)

Requests per page    3-5 requests            1 request

Data fetching        Server decides what     Client decides what
                     fields to return        fields it needs

Over-fetching        Yes (all fields)        No (only requested)

Under-fetching       Yes (need multiple      No (one query gets all)
                     endpoints)

Type safety          Manual                  Built-in schema

Documentation        Swagger/OpenAPI         Self-documenting
                     (separate)              (introspection)

Real-time            Polling or WebSocket    Subscriptions (built-in)
```

---

## How GraphQL Works Step by Step

### Step 1: Frontend Defines What It Needs

In `frontend/lib/graphql/bookings.ts`:

```typescript
// "I want all bookings with these specific fields"
export const ALL_BOOKINGS = gql`
  query AllBookings($status: String) {
    allBookings(status: $status) {
      id
      guest {
        name
        email
      }
      room {
        number
        building {
          name
        }
      }
      checkIn
      checkOut
      status
      totalPrice
    }
  }
`;
```

### Step 2: Frontend Sends the Query

In `frontend/app/dashboard/bookings/page.tsx`:

```typescript
// Apollo Client sends this query to the backend
const { data, loading } = useQuery(ALL_BOOKINGS, {
  variables: { status: "confirmed" }
});

// data.allBookings = [
//   { id: 1, guest: { name: "John" }, room: { number: "101" }, ... },
//   { id: 2, guest: { name: "Sarah" }, room: { number: "205" }, ... },
// ]
```

What actually happens on the network:

```
Browser → POST http://localhost:8000/graphql/

Headers:
  Content-Type: application/json
  Authorization: JWT eyJhbGciOiJIUzI1NiIs...

Body:
{
  "query": "query AllBookings($status: String) { allBookings(status: $status) { id guest { name } ... } }",
  "variables": { "status": "confirmed" }
}
```

### Step 3: Backend Receives and Processes

In `backend/config/schema.py`:

```python
class Query(graphene.ObjectType):
    # 1. Define what queries exist
    all_bookings = graphene.List(BookingType, status=graphene.String())

    # 2. Define how to resolve (fetch data for) each query
    @login_required  # Must be logged in
    def resolve_all_bookings(self, info, status=None):
        qs = Booking.objects.select_related("guest", "room", "room__building")
        if status:
            qs = qs.filter(status=status)
        return qs
```

What happens inside Django:

```
1. GraphQL engine parses the query string
2. Finds "allBookings" → calls resolve_all_bookings()
3. @login_required checks the JWT token
4. Builds Django QuerySet with filters
5. GraphQL engine maps Django model fields to requested fields
6. Returns JSON with ONLY the fields asked for
```

### Step 4: Backend Returns Response

```json
{
  "data": {
    "allBookings": [
      {
        "id": "1",
        "guest": { "name": "John Smith", "email": "john@email.com" },
        "room": { "number": "101", "building": { "name": "Main Wing" } },
        "checkIn": "2026-03-08",
        "checkOut": "2026-03-12",
        "status": "confirmed",
        "totalPrice": "250.00"
      }
    ]
  }
}
```

### Step 5: Frontend Renders the Data

```typescript
// In the React component:
{data.allBookings.map(booking => (
  <div key={booking.id}>
    <h3>{booking.guest.name}</h3>
    <p>Room {booking.room.number} - {booking.room.building.name}</p>
    <p>{booking.checkIn} to {booking.checkOut}</p>
    <p>Status: {booking.status}</p>
    <p>${booking.totalPrice}</p>
  </div>
))}
```

---

## How Mutations Work (Creating/Updating Data)

### Example: Creating a Booking

**Step 1: Frontend defines the mutation**

```typescript
// frontend/lib/graphql/bookings.ts
export const CREATE_BOOKING = gql`
  mutation CreateBooking(
    $guestId: Int!        # ! means required
    $roomId: Int!
    $checkIn: Date!
    $checkOut: Date!
    $totalPrice: Decimal
    $notes: String
  ) {
    createBooking(
      guestId: $guestId
      roomId: $roomId
      checkIn: $checkIn
      checkOut: $checkOut
      totalPrice: $totalPrice
      notes: $notes
    ) {
      booking {            # Return the created booking
        id
        status
      }
      message              # "Booking created successfully" or error
    }
  }
`;
```

**Step 2: Frontend calls the mutation**

```typescript
const [createBooking] = useMutation(CREATE_BOOKING);

// When user clicks "Create Booking":
const result = await createBooking({
  variables: {
    guestId: 1,
    roomId: 5,
    checkIn: "2026-03-15",
    checkOut: "2026-03-20",
    totalPrice: "500.00",
    notes: "Late check-in requested"
  }
});
// result.data.createBooking.message = "Booking created successfully"
```

**Step 3: Backend processes the mutation**

```python
# backend/config/schema.py
class CreateBooking(graphene.Mutation):
    class Arguments:
        guest_id = graphene.Int(required=True)
        room_id = graphene.Int(required=True)
        check_in = graphene.Date(required=True)
        check_out = graphene.Date(required=True)
        total_price = graphene.Decimal()
        notes = graphene.String()

    booking = graphene.Field(BookingType)
    message = graphene.String()

    @staff_required  # Only staff, managers, admins can create bookings
    def mutate(self, info, guest_id, room_id, check_in, check_out, ...):
        # 1. Check for overlapping bookings
        overlap = Booking.objects.filter(
            room_id=room_id,
            check_in__lt=check_out,
            check_out__gt=check_in,
        ).exists()

        if overlap:
            return CreateBooking(
                booking=None,
                message="Room is already booked for these dates"
            )

        # 2. Create the booking
        booking = Booking.objects.create(...)

        # 3. Mark room as booked
        Room.objects.filter(pk=room_id).update(status="booked")

        return CreateBooking(
            booking=booking,
            message="Booking created successfully"
        )
```

---

## How Authentication Works Step by Step

### Login Flow

```
1. User types username & password on /login page

2. Frontend sends GraphQL mutation:
   mutation { tokenAuth(username: "admin", password: "admin123") {
     token
     refreshToken
   }}

3. Backend:
   → Checks username/password against database
   → Generates JWT token (valid 5 minutes)
   → Generates refresh token (valid 7 days)
   → Returns both

4. Frontend:
   → Stores JWT token in cookie: "token"
   → Stores refresh token in cookie: "refreshToken"
   → Redirects to /dashboard

5. Every subsequent request:
   → Apollo Client reads token from cookie
   → Adds header: Authorization: JWT eyJhbGci...
   → Backend validates token on each request
```

### Permission Flow

```
User sends: mutation { createRoom(...) { room { id } } }
                                │
                                ▼
              ┌─────────────────────────────┐
              │  @manager_required          │
              │                             │
              │  1. Is user logged in?      │
              │     No → "Not authenticated"│
              │     Yes ↓                   │
              │                             │
              │  2. What's their role?      │
              │     guest → "Permission     │
              │              denied"        │
              │     staff → "Permission     │
              │              denied"        │
              │     manager → ✓ Proceed     │
              │     admin   → ✓ Proceed     │
              └─────────────────────────────┘
```

Role hierarchy:

```
admin    → Can do everything (including create hotels)
  ↑
manager  → Can do everything except hotel/user management
  ↑
staff    → Can create bookings, guests, update statuses
  ↑
guest    → Read-only access
```

---

## How Real-time Updates Work (WebSocket)

```
Staff A creates a booking on their computer
                │
                ▼
┌───────────────────────────────────────┐
│  Django Signal: post_save on Booking  │
│  (bookings/signals.py)               │
│                                       │
│  Sends message to channel groups:     │
│  "bookings" and "dashboard"           │
└───────────────────┬───────────────────┘
                    ▼
┌───────────────────────────────────────┐
│  Django Channels broadcasts to ALL    │
│  connected WebSocket clients          │
└───────┬──────────────┬────────────────┘
        ▼              ▼
  Staff B's browser   Manager's browser
  (bookings page)     (dashboard page)
  auto-refreshes      auto-refreshes
  booking list        stats cards
```

---

## How Celery Background Tasks Work

```
Booking created with status "confirmed"
                │
                ▼
┌───────────────────────────────────────┐
│  send_booking_confirmation.delay()    │
│  (Returns immediately - doesn't       │
│   block the response)                 │
└───────────────────┬───────────────────┘
                    ▼
┌───────────────────────────────────────┐
│  Redis Queue                          │
│  Task waiting...                      │
└───────────────────┬───────────────────┘
                    ▼
┌───────────────────────────────────────┐
│  Celery Worker picks up task          │
│  → Sends confirmation email to guest  │
│  → Runs in background                 │
│  → Doesn't slow down the website      │
└───────────────────────────────────────┘

Scheduled Tasks (Celery Beat):
┌───────────────────────────────────────┐
│  Every day at midnight:               │
│  → check_expired_bookings()           │
│    Finds bookings past checkout date  │
│    Still in "pending" status          │
│    Auto-cancels them                  │
│                                       │
│  1 day before checkout:               │
│  → send_checkout_reminder()           │
│    Emails guest about upcoming        │
│    checkout                           │
└───────────────────────────────────────┘
```

---

## Complete Request Lifecycle

When a staff member creates a booking at `http://grand.localtest.me:3000/dashboard/bookings`:

```
1. BROWSER
   User fills form, clicks "Create Booking"

2. APOLLO CLIENT (frontend/lib/apollo-client.ts)
   Detects hostname: grand.localtest.me
   Builds request:
     POST http://grand.localtest.me:8000/graphql/
     Header: Authorization: JWT eyJ...
     Body: mutation { createBooking(...) { ... } }

3. DNS
   grand.localtest.me → 127.0.0.1

4. DJANGO TENANT MIDDLEWARE
   Host: grand.localtest.me
   → Domain lookup → Tenant "grand"
   → SET search_path = grand

5. GRAPHQL ENGINE (config/schema.py)
   Parses mutation → CreateBooking.mutate()

6. PERMISSION CHECK (@staff_required)
   JWT token → User with role "staff" → Allowed ✓

7. BUSINESS LOGIC
   Check overlap → No conflict ✓
   Create booking in grand.bookings_booking
   Update room status in grand.inventory_room

8. DJANGO SIGNAL (bookings/signals.py)
   Booking saved → Broadcast to WebSocket channels

9. CELERY TASK (bookings/tasks.py)
   send_booking_confirmation.delay(booking_id)
   → Queued in Redis → Worker sends email

10. GRAPHQL RESPONSE
    { "data": { "createBooking": {
        "booking": { "id": "42", "status": "pending" },
        "message": "Booking created successfully"
    }}}

11. APOLLO CLIENT
    Updates cache → React re-renders booking list

12. WEBSOCKET BROADCAST
    Other staff browsers receive update
    Dashboard stats auto-refresh
```

---

## Technology Purpose Map

| Technology | Why We Use It | What It Does |
|---|---|---|
| **Django** | Backend framework | Handles HTTP, ORM, migrations, admin |
| **PostgreSQL** | Database | Stores all data, supports schema isolation |
| **django-tenants** | Multi-tenancy | One DB, many hotels, complete isolation |
| **Graphene-Django** | GraphQL API | Single endpoint, flexible queries |
| **graphql-jwt** | Authentication | JWT tokens for stateless auth |
| **Next.js** | Frontend framework | Server-side rendering, file-based routing |
| **React** | UI library | Component-based interactive interfaces |
| **TypeScript** | Type safety | Catch errors at compile time |
| **Apollo Client** | GraphQL client | Sends queries, caches data, manages state |
| **Tailwind CSS** | Styling | Utility classes for fast UI development |
| **Django Channels** | WebSocket | Real-time push notifications |
| **Celery** | Task queue | Background jobs (emails, cleanup) |
| **Redis** | Message broker | Passes tasks to Celery workers |
| **Docker** | Containerization | Same environment everywhere |

---

## Project File Map (What Each File Does)

### Backend

```
backend/
├── config/
│   ├── settings.py         ← All configuration (DB, CORS, JWT, tenants, Celery)
│   ├── schema.py           ← THE MAIN API FILE - all GraphQL queries & mutations
│   ├── urls.py             ← Routes: /graphql/, /api/*, /admin/
│   ├── asgi.py             ← ASGI config for WebSocket support
│   ├── routing.py          ← WebSocket URL patterns (ws/bookings/, ws/dashboard/)
│   ├── celery.py           ← Celery app configuration
│   └── __init__.py         ← Imports celery app
│
├── tenants/
│   ├── models.py           ← Tenant + Domain models (which hotel, which URL)
│   └── api.py              ← REST API for tenants
│
├── users/
│   ├── models.py           ← User model with role field (admin/manager/staff/guest)
│   ├── permissions.py      ← @admin_required, @manager_required, @staff_required
│   ├── api.py              ← REST API for users
│   ├── tests.py            ← User model tests
│   └── test_permissions.py ← Permission decorator tests
│
├── inventory/
│   ├── models.py           ← Location, Building, Floor, Room models
│   ├── api.py              ← REST API for rooms
│   └── tests.py            ← Inventory model tests
│
├── bookings/
│   ├── models.py           ← Guest + Booking models
│   ├── consumers.py        ← WebSocket consumers (receive/send real-time data)
│   ├── signals.py          ← Auto-broadcast on booking changes
│   ├── tasks.py            ← Celery tasks (emails, cleanup)
│   ├── api.py              ← REST API for bookings
│   └── tests.py            ← Booking model tests
│
└── middleware/
    └── tenant_middleware.py ← Reads hostname → activates tenant schema
```

### Frontend

```
frontend/
├── app/
│   ├── layout.tsx              ← Wraps entire app with Apollo + Auth providers
│   ├── page.tsx                ← "/" → redirects to /dashboard or /login
│   ├── login/page.tsx          ← Login form
│   ├── register/page.tsx       ← Registration form
│   ├── error.tsx               ← Error boundary (catches runtime errors)
│   ├── global-error.tsx        ← Global error boundary
│   └── dashboard/
│       ├── layout.tsx          ← Auth guard + sidebar + header layout
│       ├── page.tsx            ← Dashboard stats + recent bookings
│       ├── rooms/page.tsx      ← Room table + filters + inline edit
│       ├── bookings/page.tsx   ← Booking cards + create form + status update
│       ├── guests/page.tsx     ← Guest table + add form
│       └── hotels/page.tsx     ← Hotel/tenant management
│
├── components/
│   ├── sidebar.tsx             ← Left navigation menu
│   └── header.tsx              ← Top bar (username + logout)
│
└── lib/
    ├── apollo-client.ts        ← Apollo setup (JWT headers + tenant routing)
    ├── apollo-provider.tsx     ← React wrapper for Apollo
    ├── auth-context.tsx        ← Login/logout state + current user
    ├── use-websocket.ts        ← WebSocket hook for real-time
    └── graphql/
        ├── auth.ts             ← Login, register, verify, refresh queries
        ├── rooms.ts            ← Room CRUD queries
        ├── bookings.ts         ← Booking + guest + stats queries
        └── tenants.ts          ← Hotel/tenant queries
```
