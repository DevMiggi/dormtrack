# DormTrack: a Dormitory and Boarding House Management System

CTADWEBL Final Project.

## Group members

- Salas, Miguel G. (leader)
- Turla, Erin Gabriel R.
- Guinto, Pio Rafael D.
- Simbulan, John Paul Akio

## Concept

Many dormitories and boarding houses keep records by hand. That makes it hard to tell:

- which rooms still have free slots,
- whether a room is over capacity or a tenant is assigned twice,
- how much each tenant owes after partial payments,
- which accounts are overdue,
- which maintenance concerns are still open.

DormTrack keeps rooms, tenants, room assignments (occupancies), monthly billing, payments and maintenance requests in one system.

**Target users:**

- Dormitory or boarding-house owners and managers who assign rooms, bill tenants and record payments.
- Caretakers or staff who log and follow up maintenance requests.

## What the application does

DormTrack computes:

- room availability and the occupancy rate
- bill totals and remaining balances
- overdue accounts
- revenue and maintenance summaries

It also enforces these rules:

- no overcapacity
- no double assignment
- no overpayment
- valid maintenance status changes only

### Data it processes

The data lives in six related MongoDB collections. All six have `createdAt` and `updatedAt` timestamps.

| Collection | What one record is | Links to |
|---|---|---|
| `rooms` (main collection) | A room, with its number, floor, type, capacity, monthly rate, amenities and condition | none |
| `tenants` | A person renting a slot, with phone numbers in the `09XXXXXXXXX` format and an emergency contact | none |
| `occupancies` | A tenant assigned to a room, with move-in and move-out dates, deposit and agreed monthly rate | tenant, room |
| `billings` | One monthly bill for one occupancy: rent, utilities, other charges, discount, due date | occupancy, tenant |
| `payments` | One payment toward a bill: amount, date, method (cash, GCash, bank transfer, other) | billing, tenant |
| `maintenancerequests` | A reported problem in a room, with its category, priority and status | room, tenant (optional) |

Some values are never stored. The server calculates them on every request:

- **Room availability:** active occupants, available slots, occupancy rate and whether the room is available.
- **Bill fields:** total, amount paid, remaining balance, status (`paid`, `partial`, `unpaid`, `overdue`) and days overdue.

## Screenshots

| Landing page | Dashboard |
|---|---|
| ![Landing page](docs/screenshots/landing.png) | ![Dashboard](docs/screenshots/dashboard.png) |

| Rooms | Room details |
|---|---|
| ![Rooms](docs/screenshots/rooms.png) | ![Room details](docs/screenshots/room-details.png) |

| Tenants | Tenant details |
|---|---|
| ![Tenants](docs/screenshots/tenants.png) | ![Tenant details](docs/screenshots/tenant-details.png) |

| Occupancies | Billing |
|---|---|
| ![Occupancies](docs/screenshots/occupancies.png) | ![Billing](docs/screenshots/billing.png) |

| Payments | Maintenance |
|---|---|
| ![Payments](docs/screenshots/payments.png) | ![Maintenance](docs/screenshots/maintenance.png) |

| Reports | Not found (unknown URL) |
|---|---|
| ![Reports](docs/screenshots/reports.png) | ![Not found page](docs/screenshots/not-found.png) |

| Room not found (`/rooms/000000000000000000000000`) |
|---|
| ![Room not found](docs/screenshots/room-not-found.png) |

**Mobile (375px wide).** Below the `md` breakpoint, tables become stacked cards and the sidebar becomes a menu.

| Rooms | Dashboard | Mobile menu |
|---|---|---|
| ![Rooms on mobile](docs/screenshots/rooms-mobile.jpg) | ![Dashboard on mobile](docs/screenshots/dashboard-mobile.jpg) | ![Mobile menu](docs/screenshots/mobile-menu.jpg) |

## Tech stack

| Part | Technologies |
|---|---|
| Frontend | React with TypeScript (Vite), Tailwind CSS v4 (`@tailwindcss/vite`, theme in `@theme`), React Router, React Hook Form, Zod, `@hookform/resolvers`, axios, `lucide-react` (icons), `recharts` (report charts) |
| Backend | Node.js, Express 5, Mongoose, `cors`, `dotenv` |
| Database | MongoDB Atlas |
| Tools | Git and GitHub, ESLint |

## Project structure

```
dormtrack/
  server/
    server.js          # loads .env, connects to MongoDB, starts listening
    app.js             # configuration, middleware and route mounting only
    config/db.js       # MongoDB connection
    models/            # the six Mongoose models
    routes/            # one express.Router() per resource
    controllers/       # one controller per route file
    services/          # business rules: rooms, occupancies, billing
    middleware/        # logger, JSON 404, error handler
    utils/             # calculations, maintenance transitions, errors, ID check, dates, request helpers
    seed/seed.js       # sample data
  client/
    src/
      api/             # the one axios instance + request functions per resource
      hooks/           # useApi, useDebounce
      components/ui/   # shared UI components (Button, Card, Dialog, Toast, ...)
      components/layout/
      pages/           # the 12 pages
      schemas/         # Zod schemas for every form
      types/
      utils/format.ts  # peso, date and percent formatting
  docs/screenshots/
```

## Setup

**Requirements:**

- Node.js 22.22 or newer (React Router 8 needs it), with npm.
- A MongoDB Atlas cluster and its connection string.

**1. Server** (runs on http://localhost:5000):

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and replace the `MONGO_URI` placeholder with your real connection string. Then fill the database with sample data and start the server:

```bash
npm run seed
npm run dev
```

`npm run seed` **deletes everything** in the six collections before it inserts the sample data. Use `npm start` instead of `npm run dev` to run without auto-restart.

**2. Client** (runs on http://localhost:5173), in a second terminal:

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173.

Other client commands: `npm run build` (type check and production build) and `npm run lint`.

### Environment variables

The `.env` files are git-ignored. Only the `.env.example` files, which hold placeholders, are committed.

**`server/.env.example`**

```
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster-host>/dormtrack?retryWrites=true&w=majority
CLIENT_ORIGIN=http://localhost:5173
```

| Variable | Purpose |
|---|---|
| `PORT` | The port the Express server listens on |
| `MONGO_URI` | The MongoDB Atlas connection string, using the `dormtrack` database |
| `CLIENT_ORIGIN` | The client's address, the only origin CORS allows |

**`client/.env.example`**

```
VITE_API_URL=http://localhost:5000/api
```

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | The base URL the axios instance sends every request to |

## API documentation

Base URL: `http://localhost:5000/api`. There are 40 endpoints.

The samples below come from the real running API with the seed data loaded. IDs and dates depend on the day the seed runs. Long responses are shortened with `…`.

| # | Method | Path | Purpose | Sample request | Sample response |
|---|---|---|---|---|---|
| 1 | GET | `/api/rooms` | List rooms with D3 availability; filters search, roomType, conditionStatus; sort | `GET /api/rooms?roomType=shared&sort=roomNumber` | `200 [{"roomNumber":"203","roomType":"shared","capacity":4,"monthlyRate":2500,"activeOccupants":3,"availableSlots":1,"occupancyRate":75,"isAvailable":true,…}, …] (5 items)` |
| 2 | GET | `/api/rooms/availability` | Active rooms with availability (D3); filters roomType, minAvailableSlots | `GET /api/rooms/availability?minAvailableSlots=1` | `200 [{"roomNumber":"201","capacity":2,"activeOccupants":1,"availableSlots":1,"occupancyRate":50,"isAvailable":true,…}, …] (5 items)` |
| 3 | GET | `/api/rooms/:id/availability` | One room's availability plus currentTenants (D3) | `GET /api/rooms/6acfbfa4db280726ca76d9d5/availability` | `200 {"roomNumber":"203","activeOccupants":3,"availableSlots":1,"occupancyRate":75,"isAvailable":true,"currentTenants":[{"_id":"6acfbfa8db280726ca76d9f5","tenant":{"fullName":"Mark Bautista",…},"room":"6acfbfa4db280726ca76d9d5",…},…],…}` |
| 4 | GET | `/api/rooms/:id` | Room details: room, availability, current tenants, occupancy and maintenance history (D14) | `GET /api/rooms/6acfbfa4db280726ca76d9d5` | `200 {"roomNumber":"203","availableSlots":1,"currentTenants":[{"_id":"6acfbfa8db280726ca76d9f5","tenant":{"fullName":"Mark Bautista",…},"room":"6acfbfa4db280726ca76d9d5",…},…],"occupancyHistory":[{"_id":"6acfbfa8db280726ca76d9f7","tenant":{"fullName":"Paolo Villanueva",…},"room":"6acfbfa4db280726ca76d9d5",…},…],"maintenanceHistory":[{"_id":"6acfbfbddb280726ca76da43","room":"6acfbfa4db280726ca76d9d5","tenant":{"fullName":"Mark Bautista",…},…}],…}` |
| 5 | POST | `/api/rooms` | Create a room (capacity must match roomType, D6) | `POST /api/rooms {"roomNumber":"401","floor":"4th Floor","roomType":"double","capacity":2,"monthlyRate":3300}` | `201 {"_id":"6acfbfc08d1d951399268ebb","roomNumber":"401","roomType":"double","capacity":2,"monthlyRate":3300,"availableSlots":2,"isAvailable":true,…}` |
| 6 | PUT | `/api/rooms/:id` | Update a room (capacity cannot drop below active occupants, D6) | `PUT /api/rooms/6acfbfc08d1d951399268ebb {"monthlyRate":3400}` | `200 {"roomNumber":"401","monthlyRate":3400,"updatedAt":"2026-10-14T17:45:36.952Z",…}` |
| 7 | DELETE | `/api/rooms/:id` | Delete a room with no occupancy or maintenance history (D6) | `DELETE /api/rooms/6acfbfc08d1d951399268ebb` | `200 {"message":"Room deleted"}` |
| 8 | GET | `/api/tenants` | List tenants; filters search (name, email, phone), status; sort | `GET /api/tenants?search=santos` | `200 [{"fullName":"Maria Santos","email":"maria.santos@example.com","phone":"09170000002","status":"active",…}, …] (1 items)` |
| 9 | GET | `/api/tenants/:id` | Tenant details: current occupancy, history, bills with balances, totalOutstanding (D7) | `GET /api/tenants/6acfbfa4db280726ca76d9e0` | `200 {"fullName":"Paolo Villanueva","status":"active","currentOccupancy":{"_id":"6acfbfa8db280726ca76d9f7","tenant":"6acfbfa4db280726ca76d9e0","room":{"roomNumber":"203",…},…},"occupancyHistory":[{"_id":"6acfbfa8db280726ca76d9f7","tenant":"6acfbfa4db280726ca76d9e0","room":{"roomNumber":"203",…},…},…],"bills":[{"_id":"6acfbfb3db280726ca76da20","occupancy":{"_id":"6acfbfa8db280726ca76d9f7","room":{"_id":"6acfbfa4db280726ca76d9d5","roomNumber":"203"},…},"tenant":"6acfbfa4db280726ca76d9e0",…},…],"totalOutstanding":8650,…}` |
| 10 | POST | `/api/tenants` | Create a tenant (09XXXXXXXXX phones, optional unique email, D1) | `POST /api/tenants {"firstName":"Sample","lastName":"Tenant","phone":"09170009999","emergencyContactName":"Sample Contact","emergencyContactPhone":"09180009999"}` | `201 {"_id":"6acfbfc18d1d951399268ebc","fullName":"Sample Tenant","phone":"09170009999","status":"active",…}` |
| 11 | PUT | `/api/tenants/:id` | Update a tenant (cannot become inactive with an active occupancy, D7) | `PUT /api/tenants/6acfbfc18d1d951399268ebc {"address":"Sample St., Quezon City"}` | `200 {"fullName":"Sample Tenant","address":"Sample St., Quezon City","status":"active",…}` |
| 12 | DELETE | `/api/tenants/:id` | Delete a tenant with no occupancy, billing or payment history (D7) | `DELETE /api/tenants/6acfbfc18d1d951399268ebc` | `200 {"message":"Tenant deleted"}` |
| 13 | GET | `/api/occupancies` | List occupancies with tenant and room; filters status, room, tenant; sort | `GET /api/occupancies?status=active` | `200 [{"tenant":{"fullName":"Daniel Navarro",…},"room":{"roomNumber":"301",…},"moveInDate":"2026-06-27T00:00:00.000Z","agreedMonthlyRate":2600,"status":"active",…}, …] (13 items)` |
| 14 | GET | `/api/occupancies/:id` | One occupancy with tenant and room | `GET /api/occupancies/6acfbfaadb280726ca76d9fd` | `200 {"tenant":{"fullName":"Daniel Navarro",…},"room":{"roomNumber":"301",…},"bedLabel":"Bed D","depositAmount":2600,"agreedMonthlyRate":2600,"status":"active",…}` |
| 15 | POST | `/api/occupancies` | Assign a tenant to a room (D4 rules; rate defaults to the room rate) | `POST /api/occupancies {"tenant":"6acfbfc18d1d951399268ebc","room":"6acfbfa4db280726ca76d9d8","moveInDate":"2026-10-15"}` | `201 {"_id":"6acfbfc28d1d951399268ebd","tenant":{"fullName":"Sample Tenant",…},"room":{"roomNumber":"302",…},"agreedMonthlyRate":2300,"status":"active",…}` |
| 16 | PUT | `/api/occupancies/:id` | Update bedLabel, expectedMoveOutDate, depositAmount, agreedMonthlyRate, notes only (D5) | `PUT /api/occupancies/6acfbfc28d1d951399268ebd {"bedLabel":"Bed A","notes":"Sample"}` | `200 {"tenant":{"fullName":"Sample Tenant",…},"room":{"roomNumber":"302",…},"bedLabel":"Bed A","notes":"Sample","status":"active",…}` |
| 17 | PATCH | `/api/occupancies/:id/complete` | Move out: needs actualMoveOutDate on/after move-in, not in the future (D5) | `PATCH /api/occupancies/6acfbfc28d1d951399268ebd/complete {"actualMoveOutDate":"2026-10-15"}` | `200 {"tenant":{"fullName":"Sample Tenant",…},"room":{"roomNumber":"302",…},"status":"completed","actualMoveOutDate":"2026-10-15T00:00:00.000Z",…}` |
| 18 | PATCH | `/api/occupancies/:id/cancel` | Cancel an active occupancy (D5) | `PATCH /api/occupancies/6acfbfc38d1d951399268ebe/cancel` | `200 {"tenant":{"fullName":"Jasmine Lopez",…},"room":{"roomNumber":"303",…},"status":"cancelled",…}` |
| 19 | DELETE | `/api/occupancies/:id` | Delete a non-active occupancy with no billings (D5) | `DELETE /api/occupancies/6acfbfc38d1d951399268ebe` | `200 {"message":"Occupancy deleted"}` |
| 20 | GET | `/api/billings` | List bills with derived total, balance and status (D9); filters billingPeriod, status, tenant; sort | `GET /api/billings?status=partial` | `200 [{"tenant":{"fullName":"Angelica Ramos",…},"billingPeriod":"2026-10","dueDate":"2026-10-22T00:00:00.000Z","total":2580,"totalPaid":1200,"remainingBalance":1380,"status":"partial","daysOverdue":0,…}, …] (3 items)` |
| 21 | GET | `/api/billings/overdue` | Overdue bills only, most overdue first (D9) | `GET /api/billings/overdue` | `200 [{"tenant":{"fullName":"Paolo Villanueva",…},"billingPeriod":"2026-08","remainingBalance":2850,"status":"overdue","daysOverdue":53,…}, …] (5 items)` |
| 22 | GET | `/api/billings/:id` | One bill with its derived fields (D9) | `GET /api/billings/6acfbfb5db280726ca76da25` | `200 {"tenant":{"fullName":"Angelica Ramos",…},"billingPeriod":"2026-10","dueDate":"2026-10-22T00:00:00.000Z","total":2580,"totalPaid":1200,"remainingBalance":1380,"status":"partial","daysOverdue":0,…}` |
| 23 | POST | `/api/billings` | Create a bill: tenant copied, rent defaults to agreed rate, one per month (D8) | `POST /api/billings {"occupancy":"6acfbfaadb280726ca76d9fd","billingPeriod":"2026-11","dueDate":"2026-11-14","utilityAmount":350}` | `201 {"_id":"6acfbfc58d1d951399268ebf","billingPeriod":"2026-11","rentAmount":2600,"utilityAmount":350,"total":2950,"remainingBalance":2950,"status":"unpaid",…}` |
| 24 | PUT | `/api/billings/:id` | Update amounts and dueDate (amounts lock after a payment, D10) | `PUT /api/billings/6acfbfc58d1d951399268ebf {"utilityAmount":400}` | `200 {"billingPeriod":"2026-11","utilityAmount":400,"total":3000,"remainingBalance":3000,…}` |
| 25 | DELETE | `/api/billings/:id` | Delete a bill with no payments (D10) | `DELETE /api/billings/6acfbfc58d1d951399268ebf` | `200 {"message":"Bill deleted"}` |
| 26 | GET | `/api/payments` | Payment history with tenant and bill period; filters billing, tenant, method, from, to (D12); sort | `GET /api/payments?method=gcash` | `200 [{"tenant":{"fullName":"Angelica Ramos",…},"billing":{"_id":"6acfbfb5db280726ca76da25","billingPeriod":"2026-10"},"amount":1200,"paymentDate":"2026-10-15T00:00:00.000Z","method":"gcash","referenceNumber":"GC-SAMPLE-0017",…}, …] (8 items)` |
| 27 | GET | `/api/payments/:id` | One payment | `GET /api/payments/6acfbfabdb280726ca76da03` | `200 {"tenant":{"fullName":"Juan Dela Cruz",…},"billing":{"_id":"6acfbfabdb280726ca76da02","billingPeriod":"2026-10"},"amount":4680,"method":"other",…}` |
| 28 | POST | `/api/payments` | Record a payment: amount ≤ remaining balance; returns payment and recomputed bill (D11) | `POST /api/payments {"billing":"6acfbfb5db280726ca76da25","amount":500,"paymentDate":"2026-10-15","method":"cash"}` | `201 {"payment":{"_id":"6acfbfc78d1d951399268ec0","amount":500,"method":"cash",…},"billing":{"totalPaid":1700,"remainingBalance":880,"status":"partial",…}}` |
| 29 | DELETE | `/api/payments/:id` | Delete a payment; the bill balance updates by itself (D11) | `DELETE /api/payments/6acfbfc78d1d951399268ec0` | `200 {"message":"Payment deleted"}` |
| 30 | GET | `/api/maintenance-requests` | List requests with room and tenant; filters status, priority, room; sort | `GET /api/maintenance-requests?status=open` | `200 [{"room":{"_id":"6acfbfa4db280726ca76d9d2","roomNumber":"103","floor":"1st Floor",…},"tenant":{"fullName":"Maria Santos",…},"category":"furniture","description":"Cabinet door hinge is loose.","priority":"low","status":"open",…}, …] (3 items)` |
| 31 | GET | `/api/maintenance-requests/:id` | One maintenance request | `GET /api/maintenance-requests/6acfbfbddb280726ca76da45` | `200 {"room":{"_id":"6acfbfa4db280726ca76d9d2","roomNumber":"103","floor":"1st Floor",…},"category":"furniture","priority":"low","status":"open","dateReported":"2026-10-14T17:45:33.227Z",…}` |
| 32 | POST | `/api/maintenance-requests` | Report a problem (always starts open) | `POST /api/maintenance-requests {"room":"6acfbfa4db280726ca76d9d6","category":"furniture","description":"Sample: loose door knob","priority":"low"}` | `201 {"_id":"6acfbfc88d1d951399268ec1","room":{"_id":"6acfbfa4db280726ca76d9d6","roomNumber":"204","floor":"2nd Floor",…},"category":"furniture","description":"Sample: loose door knob","priority":"low","status":"open",…}` |
| 33 | PUT | `/api/maintenance-requests/:id` | Update a request (never changes status, D13) | `PUT /api/maintenance-requests/6acfbfc88d1d951399268ec1 {"priority":"medium"}` | `200 {"room":{"_id":"6acfbfa4db280726ca76d9d6","roomNumber":"204","floor":"2nd Floor",…},"priority":"medium","status":"open",…}` |
| 34 | PATCH | `/api/maintenance-requests/:id/status` | Change status through the D13 state machine (resolving needs resolutionNotes) | `PATCH /api/maintenance-requests/6acfbfc88d1d951399268ec1/status {"status":"in_progress"}` | `200 {"room":{"_id":"6acfbfa4db280726ca76d9d6","roomNumber":"204","floor":"2nd Floor",…},"priority":"medium","status":"in_progress",…}` |
| 35 | DELETE | `/api/maintenance-requests/:id` | Delete a maintenance request | `DELETE /api/maintenance-requests/6acfbfc88d1d951399268ec1` | `200 {"message":"Maintenance request deleted"}` |
| 36 | GET | `/api/dashboard/summary` | Dashboard summary (D15) | `GET /api/dashboard/summary` | `200 {"totalRooms":8,"totalCapacity":30,"occupiedSlots":13,"vacantSlots":17,"occupancyRate":43.33,"collectionsThisMonth":15190,"totalOutstanding":39530,"overdueCount":5,"openMaintenance":{"total":5,"urgent":1},"roomsNearCapacity":[{"roomNumber":"203",…}]}` |
| 37 | GET | `/api/reports/revenue` | Revenue: total, byMonth, byMethod; optional from/to (D16) | `GET /api/reports/revenue?from=2026-06-17&to=2026-10-15` | `200 {"totalCollected":86570,"byMonth":[{"month":"2026-08","total":38750},…],"byMethod":[{"method":"cash","total":20720,"count":7},…]}` |
| 38 | GET | `/api/reports/outstanding` | Every bill with a balance, most overdue first, plus totalOutstanding (D16) | `GET /api/reports/outstanding` | `200 {"totalOutstanding":39530,"bills":[{"roomNumber":"203",…},…]}` |
| 39 | GET | `/api/reports/occupancy` | Occupancy per active room, per room type, and overall (D16) | `GET /api/reports/occupancy` | `200 {"overallRate":43.33,"totalCapacity":30,"totalOccupants":13,"byRoomType":[{"roomType":"single","rooms":1,"capacity":1,…},…],"rooms":[{"roomNumber":"101",…},…]}` |
| 40 | GET | `/api/reports/maintenance` | Maintenance counts by status and priority, averageResolutionDays (D16) | `GET /api/reports/maintenance` | `200 {"byStatus":[{"status":"open","count":3},…],"byPriority":[{"priority":"low","count":3},…],"averageResolutionDays":1.3,"resolvedCount":3}` |

### Errors

Every error is JSON in the form `{ "message": "..." }`. The API uses only these status codes:

| Code | When it is used |
|---|---|
| 200 | A successful read, update or delete |
| 201 | A successful create |
| 400 | A validation error, invalid ID, broken business rule or duplicate value |
| 404 | A record that does not exist, or an unknown route |
| 500 | An unexpected server error |

Sample error responses, also taken from the running API:

| Case | Sample request | Response |
|---|---|---|
| Room is full (D4) | `POST /api/occupancies {"tenant":"6acfbfa5db280726ca76d9e8","room":"6acfbfa4db280726ca76d9d7","moveInDate":"2026-10-15"}` | `400 {"message":"Room 301 is full (4 of 4 slots taken)"}` |
| Payment above the balance (D11) | `POST /api/payments {"billing":"6acfbfb5db280726ca76da25","amount":99999,"paymentDate":"2026-10-15","method":"cash"}` | `400 {"message":"Amount cannot exceed the remaining balance of ₱1,380.00"}` |
| Validation error (missing fields) | `POST /api/rooms {}` | ``400 {"message":"Path `monthlyRate` is required. Path `capacity` is required. Path `roomType` is required. Path `floor` is required. Path `roomNumber` is required."}`` |
| Duplicate key | `POST /api/rooms {"roomNumber":"101","floor":"1st Floor","roomType":"single","capacity":1,"monthlyRate":4500}` | `400 {"message":"roomNumber already exists"}` |
| Invalid ID | `GET /api/rooms/abc` | `400 {"message":"Invalid ID"}` |
| Not found | `GET /api/rooms/000000000000000000000000` | `404 {"message":"Room not found"}` |
| Unknown route | `GET /api/nothing` | `404 {"message":"Route not found: GET /api/nothing"}` |

### List filters and sorting

List endpoints return plain arrays, with no pagination.

| Endpoint | Filters |
|---|---|
| `GET /api/rooms` | `search` (roomNumber or floor), `roomType`, `conditionStatus` |
| `GET /api/rooms/availability` | `roomType`, `minAvailableSlots` |
| `GET /api/tenants` | `search` (name, email, phone), `status` |
| `GET /api/occupancies` | `status`, `room`, `tenant` |
| `GET /api/billings` | `billingPeriod`, `status`, `tenant` |
| `GET /api/payments` | `billing`, `tenant`, `method`, `from`, `to` |
| `GET /api/maintenance-requests` | `status`, `priority`, `room` |

Every list also takes `sort`: one field name, with an optional `-` prefix for descending order (for example `sort=-monthlyRate`).

## Features

**Pages (12):**

| Page | Route | What it does |
|---|---|---|
| Landing | `/` | Introduces DormTrack and links to the dashboard |
| Dashboard | `/dashboard` | Summary stat cards, rooms near capacity, overdue bills and open maintenance |
| Rooms | `/rooms` | Search and filter rooms; an availability bar per room; add and edit room dialog; delete with confirmation |
| Room details | `/rooms/:id` | Room info, current tenants, slots left, occupancy and maintenance history |
| Tenants | `/tenants` | Search and filter tenants; add and edit tenant dialog; delete with confirmation |
| Tenant details | `/tenants/:id` | Tenant info, current room, occupancy history, bills with balances and total outstanding |
| Occupancies | `/occupancies` | Assign a tenant to a room (only available rooms are offered), move-out and cancel actions |
| Billing | `/billing` | Create and edit bills with a live total preview; balance and status per bill; overdue filter |
| Payments | `/payments` | Record payments, showing the remaining balance before saving; payment history |
| Maintenance | `/maintenance` | Requests with status and priority filters; only the valid next-status buttons are shown |
| Reports | `/reports` | Revenue, occupancy, maintenance and outstanding reports with charts |
| Not found | `*` | A friendly 404 page for unknown URLs |

**Business rules the server enforces:**

- A room's capacity must match its type, and capacity cannot drop below the current occupants.
- A tenant cannot be assigned to a full or non-active room, cannot be assigned while inactive, and cannot be assigned twice.
- One bill per occupancy per month. A discount cannot make the total negative.
- A payment cannot be more than the remaining balance, and a fully paid bill takes no more payments.
- Maintenance status follows a fixed path: open → in progress → resolved, and open or in progress → cancelled.
- Records with history cannot be deleted. Rooms and tenants are set to inactive instead.

**Across the interface:**

- Every page that loads data shows a loading state, an error state with the server's message, and an empty state.
- The detail pages show a "not found" state for a missing record.
- Forms check every field with Zod before sending. Each field shows its own error, the submit button is disabled while saving, and server 400 messages appear inside the form.
- Every delete asks for confirmation, and every create, update and delete shows a success toast.
- The layout works at 375px wide and on desktop, with no sideways page scrolling.

## Known limitations and assumptions

### Out of scope

DormTrack does not have:

- authentication (anyone who can open the app can use every page)
- online payments (payments are recorded by hand after they are received)
- deployment (it runs locally)
- file uploads
- SMS
- email notifications

### Decisions (D1 to D17)

These are the rules the project proposal left open, and how DormTrack handles them.

- **D1. Validation formats.**
  - `phone` and `emergencyContactPhone` use the Philippine mobile format `09XXXXXXXXX` (pattern `^09\d{9}$`).
  - `email` is optional, but if given it must be valid and unique.
- **D2. Dates and money.**
  - Dates are compared by calendar day, and "in the future" means after today.
  - Money is in pesos (₱, 2 decimals), rounded with `Math.round(x * 100) / 100`.
- **D3. Room availability** is calculated from active occupancies on every request and never stored.
  - availableSlots = max(0, capacity − activeOccupants)
  - occupancyRate = activeOccupants ÷ capacity × 100
  - A room is available when it is `active` and has a free slot.
- **D4. Creating an occupancy is refused (400) when:**
  - the room is not `active` or has no free slot
  - the tenant is not `active` or already has an active occupancy
  - the expected move-out date is before move-in

  A missing room or tenant returns 404. `agreedMonthlyRate` defaults to the room's monthly rate.
- **D5. Occupancy changes.**
  - Only active occupancies can be completed or cancelled.
  - Completing needs a move-out date that is on or after move-in and not in the future.
  - `PUT` changes only `bedLabel`, `expectedMoveOutDate`, `depositAmount`, `agreedMonthlyRate` and `notes`.
  - Only a non-active occupancy with no bills can be deleted.
- **D6. Rooms.**
  - Capacity must match the type: single = 1, double = 2, shared = 3 to 20.
  - Capacity cannot drop below the current active occupants.
  - A room with occupancy or maintenance history cannot be deleted ("Set the room to inactive instead").
- **D7. Tenants.**
  - A tenant with an active occupancy cannot be set to inactive.
  - A tenant with occupancy, billing or payment history cannot be deleted ("Set the tenant to inactive instead").
- **D8. Creating a bill.**
  - The occupancy must exist (404) and be active (400).
  - `tenant` is copied from the occupancy, and rent defaults to the agreed monthly rate.
  - total = rent + utilities + other charges − discount. A negative total is refused ("Discount cannot exceed total charges").
  - A second bill for the same occupancy and month is refused ("A bill for this period already exists").
- **D9. Bill status** is derived on every read, never stored:
  - `paid` if nothing is left to pay
  - otherwise `overdue` if the due date has passed
  - otherwise `partial` if something was paid
  - otherwise `unpaid`
- **D10. Changing a bill.**
  - Once a bill has a payment, its amounts cannot change, but the due date still can.
  - A bill with payments cannot be deleted.
- **D11. Payments.**
  - The amount must be at least ₱0.01 and at most the remaining balance.
  - A fully paid bill takes no payments, and `tenant` is copied from the bill.
  - Payments cannot be edited on purpose. A wrong payment is deleted and recorded again, so the payment history stays honest.
- **D12. Payment filters:** `billing`, `tenant`, `method`, `from`, `to`.
- **D13. Maintenance.**
  - The allowed changes are open → in_progress or cancelled, and in_progress → resolved or cancelled. Resolved and cancelled are final.
  - Resolving needs resolution notes and records `resolvedAt`.
  - `PUT` never changes the status.
- **D14. Room details** include the availability fields, current tenants, occupancy history and maintenance history.
- **D15. Dashboard.**
  - Capacity figures count active rooms only.
  - "Collections this month" adds up the payments dated in the current month.
  - "Rooms near capacity" are active rooms at 75% or more that are not yet full.
- **D16. Reports.**
  - Revenue accepts optional `from` and `to` dates; invalid or reversed dates return 400.
  - Average resolution days is `resolvedAt − dateReported`, to 1 decimal, or `null` when nothing is resolved.
  - The outstanding report is sorted by days overdue, then by balance.
- **D17. List filters:** see [List filters and sorting](#list-filters-and-sorting).

### Other assumptions

- **Server time zone.** "Today" is the server computer's local date. This matters for overdue bills and future-date checks.
- **Text cleanup.** Typed text is trimmed of extra spaces, and tenant emails are saved in lowercase, so the same email cannot be entered twice with different capitals.
- **Bill updates.** A bill's `PUT` can change only the amounts and the due date. The occupancy, tenant and billing period stay fixed.
- **Room list.** `GET /api/rooms` also returns each room's availability fields, so the Rooms page can draw its availability bars.
- **Full-room demo needs two tabs.** The Occupancies page only offers rooms with a free slot, so a full room cannot be picked directly. To see the server's "room is full" error in the UI:
  1. Open the Occupancies page in two browser tabs.
  2. In both tabs, start an assignment to the same room's last free slot.
  3. Save in the first tab.
  4. Save in the second tab. The 400 message appears in that form.
- **Sorting** works on stored fields only, not on calculated values such as `remainingBalance`.
- **Sample data.** The seed's dates are relative to the day it runs, so the demo looks right on any date. Running the seed again resets all data.
- **Bundle size.** The production build prints a chunk-size warning because of the chart library. It is a warning, not an error, and the app works normally.

## Data flow

```
React page → axios → Express route → controller → service → Mongoose → MongoDB → JSON → React
```

Example: assigning a tenant to a room.

1. **React page.** On the Occupancies page, the form is checked by its Zod schema, then calls `createOccupancy()` in `client/src/api/occupancies.ts`.
2. **axios.** The one axios instance in `client/src/api/axios.ts` sends `POST /api/occupancies` to the server.
3. **Express route.** `server/routes/occupancies.js` matches the path and calls the controller.
4. **Controller.** `server/controllers/occupancyController.js` reads the request body and calls the service.
5. **Service.** `server/services/occupancyService.js` checks the D4 rules: room active and not full, tenant active and not already assigned, dates in order.
6. **Mongoose and MongoDB.** The `Occupancy` model validates the fields and saves the record to MongoDB Atlas.
7. **JSON.** The server answers `201` with the new occupancy, or `400` / `404` with `{ "message": "..." }`.
8. **Back in React.** The page shows a success toast and reloads the list, or shows the error message inside the form.
