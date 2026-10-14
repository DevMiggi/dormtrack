# DormTrack: Project Rules for Claude Code

This file is the single source of truth for this project. It is based on the CTADWEBL Final Project instructions and rubric. Read all of it before writing any code.

The group of four shares **one laptop**. Every checkpoint in §12 has an **owner**. The owner sits at the laptop for that checkpoint, reads your explanation, and the work is committed under that owner's GitHub identity (§1).

---

## 0. How you must work (non-negotiable)

1. **Build only what is in this file.** Do not add collections, fields, endpoints, pages or features that are not listed. Do not add authentication, online payments, deployment, file uploads, SMS or email.
2. **Never fabricate.** Do not invent requirements, rules, statistics, testimonials or claims. Use names exactly as written: collections, fields, enum values, routes and pages. The only invented content allowed is the **sample seed data** in §10, which is clearly demo data.
3. **Missing detail?** Check §9 Decisions first. If it is still not covered, STOP and ask. Do not guess.
4. **Work one phase at a time** (§12), and only the phase named in the user's prompt.
5. **CHECKPOINTS.** At every checkpoint, stop and print:
   - (a) **Owner: <name>**, taken from §12
   - (b) the files you created or changed
   - (c) a suggested commit message (style: `feat(server): add Room model with capacity rules`)
   - (d) a short plain-English explanation of what the code does and why, written for the owner
   - (e) 3 questions an instructor might ask the owner about this code in the defense, with short answers

   Then say: "<Owner>, read the explanation, then type `commit`." Wait for that.
6. **Git (the group is new to Git; you run the commands).**
   - When the user types `commit`:
     1. Run `git add` on exactly that checkpoint's files.
     2. Commit **as the checkpoint's owner**, using their name and email from §1, for that one commit only:
        ```
        git -c user.name="<Name>" -c user.email="<Email>" commit -m "<message>"
        ```
     3. Show `git log -1 --format="%an <%ae>"` so the author can be checked.
   - Never run `git config` to change anything. Never commit a checkpoint under anyone other than its §12 owner.
   - When the user types `push`, run `git push`. If a sign-in window appears, tell the user to complete it, then retry.
   - Never run `git reset --hard`, `git push --force`, `git rebase`, or delete branches.
   - If any git command fails, stop and explain the error in plain words with the exact fix.
7. **Secrets.**
   - The real `MONGO_URI` is given **only in the user's chat prompt**, never in this file. Write it **only** into `server/.env`, and only after:
     - `.gitignore` contains `.env`, and
     - `git check-ignore server/.env` prints `server/.env`.
   - Never put it in any other file, commit, log or README, and never echo it back. `.env.example` files hold placeholders only.
   - **If connecting fails with `querySrv ECONNREFUSED`** (a DNS problem on the laptop), do not add code. Look up the cluster's SRV and TXT records using a public DNS server (8.8.8.8), build the equivalent standard `mongodb://host1,host2,host3/dormtrack?ssl=true&replicaSet=...&authSource=admin` string with the same username and password, and put that in `server/.env` instead.
   - Before every commit, confirm `.env` is not staged (`git status`).
8. **Packages:** use only the packages in §2. Ask before installing anything else.
9. **Verify before saying a checkpoint is done:**
   - Server: it starts, and you `curl` every endpoint you wrote, including a success case, a 400 case and a 404 case where they apply.
   - Client: `npm run build` and `npm run lint` pass with no errors.
10. **Readable code:** a 3rd-year IT student must be able to explain every line. Use plain names and short functions, and add comments only where a business rule is non-obvious.

---

## 1. The project

**DormTrack: a Dormitory and Boarding House Management System.**

**Problem:** Many dormitories and boarding houses keep records by hand. That makes it hard to tell:
- which rooms still have free slots,
- whether a room is over capacity or a tenant is assigned twice,
- how much each tenant owes after partial payments,
- which accounts are overdue,
- which maintenance concerns are still open.

**What it does:** DormTrack keeps rooms, tenants, room assignments (occupancies), monthly billing, payments and maintenance requests in one system. It computes:
- room availability and the occupancy rate
- bill totals and remaining balances
- overdue accounts
- revenue and maintenance summaries

It also enforces rules: no overcapacity, no double assignment, no overpayment, and valid maintenance status changes only.

**Target users:**
- Dormitory or boarding-house owners and managers who assign rooms, bill tenants and record payments.
- Caretakers or staff who log and follow up maintenance requests.

**Group members and Git identities.** Each email must also be added and **verified** in that member's GitHub account (GitHub → Settings → Emails), or their commits will not appear on their profile.

| Member | Short name | Git name | Git email |
|---|---|---|---|
| Salas, Miguel G. (leader) | Miguel | Miguel G. Salas | salasmiguelsalas464@gmail.com |
| Turla, Erin Gabriel R. | Erin | Erin Gabriel R. Turla | itsnotsafe56@gmail.com |
| Guinto, Pio Rafael D. | Pio | Pio Rafael D. Guinto | toguinpio@gmail.com |
| Simbulan, John Paul Akio | John Paul | John Paul Akio Simbulan | jhnplaksmbl@gmail.com |

**Work assignment** (§12 follows it):

| Member | Feature owned | Backend | Frontend |
|---|---|---|---|
| Miguel | Project setup and occupancies | Express app setup, middleware, error handler, database connection, Occupancy model, assignment rules, occupancy routes, seed script | Vite project, Tailwind theme, router, layout, axios instance, shared components, custom hook, Occupancies page, Not Found page |
| Erin | Rooms and tenants | Room and Tenant models, room availability logic, room and tenant routes | Rooms, Room details, Tenants, Tenant details pages |
| Pio | Billing and payments | Billing and Payment models, billing calculations, payment validation, billing and payment routes, revenue and outstanding reports | Billing, Payments, Reports pages |
| John Paul | Maintenance, dashboard and docs | MaintenanceRequest model, status state machine, maintenance routes, dashboard summary, occupancy and maintenance reports | Landing, Dashboard, Maintenance pages, README with API table |

---

## 2. Stack and folder structure

**Required technologies:**
- React (Vite) with TypeScript
- Tailwind CSS (v4 with the `@tailwindcss/vite` plugin; theme in CSS with `@theme`)
- React Router
- React Hook Form, Zod and `@hookform/resolvers`
- axios
- `lucide-react` (icons) and `recharts` (report charts)
- Node.js and Express
- MongoDB Atlas and Mongoose
- `cors` and `dotenv`
- Git and GitHub

**One repository, two top-level folders:**

```
dormtrack/
  CLAUDE.md
  README.md
  .gitignore                 # node_modules/, .env, dist/  (keep !.env.example)
  docs/screenshots/
  server/
    package.json             # "type": "module"; scripts: start, dev (node --watch), seed
    .env.example             # PORT, MONGO_URI, CLIENT_ORIGIN (placeholders only)
    server.js                # load env, connect to MongoDB, listen
    app.js                   # ONLY configuration, middleware and route mounting
    config/db.js
    models/                  # Room.js Tenant.js Occupancy.js Billing.js Payment.js MaintenanceRequest.js
    routes/                  # rooms.js tenants.js occupancies.js billings.js payments.js
                             #   maintenanceRequests.js dashboard.js reports.js  (express.Router())
    controllers/             # one controller file per route file
    middleware/              # logger.js notFound.js errorHandler.js
    services/                # roomService.js occupancyService.js billingService.js
    utils/                   # calculations.js maintenanceTransitions.js httpError.js validateId.js
    seed/seed.js
  client/
    .env.example             # VITE_API_URL=http://localhost:5000/api
    src/
      api/axios.ts           # the ONE axios instance (axios.create with baseURL from VITE_API_URL)
      api/                   # small request functions per resource
      hooks/                 # useApi.ts (required) and useDebounce.ts
      components/ui/         # Button, Card, Badge, Input, Select, FieldError, PageHeader, StatCard,
                             #   LoadingState, ErrorState, EmptyState, ConfirmDialog, Dialog, Toast
      components/layout/     # AppLayout, Sidebar, Topbar (mobile menu), Logo
      pages/
      schemas/               # Zod schemas (outside components) + z.infer types
      types/
      utils/                 # format.ts (peso, dates, percent)
```

---

## 3. Collections (six, all with `timestamps: true`)

### rooms (MAIN collection)
- `roomNumber`: String, required, unique, trimmed, max 30
- `floor`: String, required, max 50
- `roomType`: enum `single`, `double`, `shared`; required
- `capacity`: Number, required, min 1, max 20 (must match roomType, see D6)
- `monthlyRate`: Number, required, min 0
- `amenities`: [String], default []
- `conditionStatus`: enum `active`, `maintenance`, `inactive`; default `active`
- `notes`: String, max 1000

### tenants
- `firstName`, `lastName`: String, required, max 80
- `email`: String, optional, unique + sparse, valid email format
- `phone`: String, required, pattern `^09\d{9}$`
- `address`: String, max 300
- `emergencyContactName`: String, required, max 160
- `emergencyContactPhone`: String, required, pattern `^09\d{9}$`
- `status`: enum `active`, `inactive`; default `active`
- Virtual `fullName`, included in JSON

### occupancies (a tenant assigned to a room)
- `tenant`: ObjectId ref Tenant, required
- `room`: ObjectId ref Room, required
- `bedLabel`: String, max 50
- `moveInDate`: Date, required
- `expectedMoveOutDate`: Date, optional
- `actualMoveOutDate`: Date, optional
- `depositAmount`: Number, min 0, default 0
- `agreedMonthlyRate`: Number, required, min 0
- `status`: enum `active`, `completed`, `cancelled`; default `active`
- `notes`: String, max 1000
- Indexes: `{ room: 1, status: 1 }`, `{ tenant: 1, status: 1 }`

### billings (one monthly bill for one occupancy)
- `occupancy`: ObjectId ref Occupancy, required
- `tenant`: ObjectId ref Tenant, required (copied from the occupancy, D8)
- `billingPeriod`: String, required, pattern `^\d{4}-(0[1-9]|1[0-2])$` (YYYY-MM)
- `rentAmount`: Number, required, min 0
- `utilityAmount`, `otherCharges`, `discount`: Number, min 0, default 0
- `dueDate`: Date, required
- Unique compound index: `{ occupancy: 1, billingPeriod: 1 }`
- **No stored status, total or balance.** These are derived (D9).

### payments
- `billing`: ObjectId ref Billing, required
- `tenant`: ObjectId ref Tenant, required (copied from the billing, D11)
- `amount`: Number, required, min 0.01
- `paymentDate`: Date, required, not in the future
- `method`: enum `cash`, `gcash`, `bank_transfer`, `other`; required
- `referenceNumber`: String, max 100
- `notes`: String, max 500

### maintenancerequests (model `MaintenanceRequest`)
- `room`: ObjectId ref Room, required
- `tenant`: ObjectId ref Tenant, optional
- `category`: enum `plumbing`, `electrical`, `furniture`, `appliance`, `cleaning`, `other`; required
- `description`: String, required, max 1000
- `priority`: enum `low`, `medium`, `high`, `urgent`; default `medium`
- `status`: enum `open`, `in_progress`, `resolved`, `cancelled`; default `open`
- `dateReported`: Date, default now, not in the future
- `resolvedAt`: Date, optional
- `resolutionNotes`: String, max 1000

---

## 4. Data processing rules

| Feature | Rule or computation | Endpoint |
|---|---|---|
| Room availability | activeOccupants = active occupancies in the room; availableSlots = max(0, capacity − activeOccupants); occupancyRate = activeOccupants ÷ capacity × 100; isAvailable = conditionStatus is `active` and availableSlots > 0. (D3) | GET /api/rooms/availability, GET /api/rooms/:id/availability |
| Assignment rules | A new occupancy is refused when the room is full or not `active`, the tenant is not `active`, the tenant already has an active occupancy, or the expected move-out date is before move-in. (D4) | POST /api/occupancies |
| Move-out and cancel | Only active occupancies can be completed or cancelled; completing needs a valid move-out date. (D5) | PATCH /api/occupancies/:id/complete, PATCH /api/occupancies/:id/cancel |
| Billing total | total = rent + utilities + other charges − discount; a discount that makes the total negative is refused; one bill per occupancy per month. (D8) | POST /api/billings |
| Balance and status | totalPaid = sum of payments; remainingBalance = max(0, total − totalPaid); status is `paid`, `overdue`, `partial` or `unpaid`, derived on every read. (D9) | All billing reads |
| Overdue processing | Bills with a balance past the due date, with daysOverdue, sorted most overdue first. (D9) | GET /api/billings/overdue |
| Payment validation | Amount > 0 and ≤ remaining balance; no payments on a fully paid bill. (D11) | POST /api/payments |
| Maintenance state machine | open → in_progress or cancelled; in_progress → resolved or cancelled; resolved and cancelled are final. Resolving records `resolvedAt`. (D13) | PATCH /api/maintenance-requests/:id/status |
| Dashboard summary | Capacity, occupied and vacant slots, occupancy rate, collections this month, total outstanding, overdue count, open maintenance count, rooms near capacity. (D15) | GET /api/dashboard/summary |
| Reports | Revenue by month and method; occupancy by room and room type; maintenance by status and priority with average resolution days; outstanding balances. (D16) | GET /api/reports/revenue, /occupancy, /maintenance, /outstanding |

---

## 5. Endpoints (exactly 40)

| Resource | Endpoints | Count | Owner |
|---|---|---|---|
| /api/rooms | GET list, GET /availability, GET /:id/availability, GET /:id, POST, PUT /:id, DELETE /:id | 7 | Erin |
| /api/tenants | GET list, GET /:id, POST, PUT /:id, DELETE /:id | 5 | Erin |
| /api/occupancies | GET list, GET /:id, POST, PUT /:id, PATCH /:id/complete, PATCH /:id/cancel, DELETE /:id | 7 | Miguel |
| /api/billings | GET list, GET /overdue, GET /:id, POST, PUT /:id, DELETE /:id | 6 | Pio |
| /api/payments | GET list, GET /:id, POST, DELETE /:id | 4 | Pio |
| /api/maintenance-requests | GET list, GET /:id, POST, PUT /:id, PATCH /:id/status, DELETE /:id | 6 | John Paul |
| /api/dashboard | GET /summary | 1 | John Paul |
| /api/reports | GET /revenue, GET /outstanding | 2 | Pio |
| /api/reports | GET /occupancy, GET /maintenance | 2 | John Paul |

Notes:
- Full CRUD is on `rooms`, the main collection. Do not add other endpoints, not even a health check.
- Register fixed paths (`/availability`, `/overdue`) **before** `/:id` routes.
- Payments have no PUT on purpose. A wrong payment is deleted and recorded again, so the payment history stays honest.

---

## 6. API conventions

- Plural noun paths, and the HTTP method is the verb.
- Only these status codes: **200** (read, update, delete), **201** (create), **400** (validation, invalid ID, rule violation, duplicate key), **404** (record not found, unknown route), **500** (unexpected).
- Every error is JSON `{ "message": "..." }`. No HTML error pages and no stack traces in responses.
- Mongoose `ValidationError` returns 400, and the message names the failing fields.
- An invalid ObjectId (in params, body references or query filters) returns 400 `{ "message": "Invalid ID" }`. A valid ID that does not exist returns 404.
- Duplicate key (code 11000) returns 400, for example `{ "message": "roomNumber already exists" }`.
- Middleware is registered in `app.js` in exactly this order:
  1. `cors({ origin: process.env.CLIENT_ORIGIN })`
  2. `express.json()`
  3. custom request logger (method, path, status, ms)
  4. routes
  5. JSON 404 catch-all
  6. error handler (last)
- Express 5 is used, so async errors reach the error handler without try/catch wrappers.
- List endpoints return plain arrays (no pagination). They support `search`, the filters listed in D17, and `sort`.

---

## 7. Pages (12, React Router)

| No. | Page | Route | Purpose | Owner |
|---|---|---|---|---|
| 1 | Landing page | / | Introduces DormTrack and links to the dashboard | John Paul |
| 2 | Dashboard | /dashboard | Summary stat cards, rooms near capacity, overdue bills, open maintenance | John Paul |
| 3 | Rooms | /rooms | Search and filter rooms; availability bar per room; add/edit room dialog | Erin |
| 4 | Room details | /rooms/:id | Room info, current tenants, slots left, occupancy and maintenance history | Erin |
| 5 | Tenants | /tenants | Search and filter tenants; add/edit tenant dialog | Erin |
| 6 | Tenant details | /tenants/:id | Tenant info, current room, occupancy history, bills with balances, total outstanding | Erin |
| 7 | Occupancies | /occupancies | Assign tenant to room (only available rooms offered), move-out and cancel actions | Miguel |
| 8 | Billing | /billing | Create/edit bills with a live total preview; balance and status per bill; overdue filter | Pio |
| 9 | Payments | /payments | Record payments (shows remaining balance before saving); payment history | Pio |
| 10 | Maintenance | /maintenance | Requests with status and priority filters; only valid next-status buttons shown | John Paul |
| 11 | Reports | /reports | Revenue, occupancy, maintenance and outstanding reports with charts | Pio |
| 12 | Not found | * | Friendly 404 page | Miguel |

The landing page uses only content from §1. No fake testimonials, user counts or claims.

---

## 8. Frontend requirements (from the rubric; all mandatory)

**API and data:**
- Every API call goes through the single axios instance in `src/api/axios.ts`.
- `src/hooks/useApi.ts` returns `{ data, loading, error, refetch }`.
- Every screen that loads data shows a loading state and an error state. No blank screens and no silent failures. Show the server's `message` on errors.
- Visible empty states.
- Detail pages show a clear "not found" state on a 404.

**Forms:**
- Create and edit forms use React Hook Form with a Zod schema kept in `src/schemas/`, outside the component.
- Types come from `z.infer<typeof schema>`.
- Each field shows its own error message.
- The submit button is disabled while submitting.
- Server 400 messages are shown in the form.

**Feedback:**
- Every delete asks for confirmation (ConfirmDialog).
- Success feedback (Toast) after create, update and delete.

**React fundamentals:**
- Lists render with `map()` and use MongoDB `_id` as the key, never the array index.
- Derived values are computed during render and never stored in state: the billing total preview, available slots, percentages, list totals and similar.
- Use conditional rendering for loading, error, empty and content states.

**Design:**
- A deliberate palette defined in the Tailwind theme (`@theme` in `src/index.css`):
  - primary: pine `#2F5D50`
  - accent: brass `#C8961E`
  - ink: `#1B2430`
  - surface: `#F1F4F3`
  - status colors: available/paid green, partial/near-full amber, overdue/full red, maintenance slate
- Consistent corners, shadows, spacing and type hierarchy. Buttons, cards and form fields look the same on every page.
- No leftover Vite starter styles. Do not copy class examples.
- Fully usable at **375px** and on desktop, with **no page-level horizontal scrolling**. Below the `md` breakpoint, tables become stacked cards. The sidebar becomes a mobile menu.

---

## 9. Decisions (rules the proposal left open)

List these in the README under "Known limitations and assumptions".

**D1. Validation formats.**
- `phone` and `emergencyContactPhone` use the Philippine mobile format `^09\d{9}$`.
- `email` is optional, but if given it must be valid and unique.

**D2. Dates.** Compare dates by calendar day. "In the future" means after today. Money is in pesos (₱, 2 decimals), and rounding uses `Math.round(x * 100) / 100`.

**D3. Room availability** (`services/roomService.js`).
- Computed from active occupancies every time. Never stored.
- `GET /api/rooms/availability` returns every **active** room with:
  - `activeOccupants`
  - `availableSlots`
  - `occupancyRate`
  - `isAvailable`

  Optional filters: `roomType`, `minAvailableSlots`.
- `GET /api/rooms/:id/availability` returns the same fields for one room, plus `currentTenants`.

**D4. Creating an occupancy** (`services/occupancyService.js`). Refuse with 400 when:
- the room is not `active`
- the room has no available slot
- the tenant is not `active`
- the tenant already has an `active` occupancy
- `expectedMoveOutDate` is before `moveInDate`

A missing room or tenant returns 404. `agreedMonthlyRate` defaults to the room's `monthlyRate` if it is not given.

**D5. Occupancy changes.**
- `PATCH /:id/complete` needs `actualMoveOutDate`. It must be on or after `moveInDate` and not in the future. Status becomes `completed`.
- `PATCH /:id/cancel`: status becomes `cancelled`.
- Both only work on `active` occupancies. `completed` and `cancelled` are final (400).
- `PUT` may change only `bedLabel`, `expectedMoveOutDate`, `depositAmount`, `agreedMonthlyRate` and `notes`. It never changes tenant, room or status.
- `DELETE` only works on a non-active occupancy with no billings (otherwise 400).

**D6. Rooms.**
- Capacity must match the type:
  - `single` = 1
  - `double` = 2
  - `shared` = 3 to 20
- On update, capacity cannot drop below the current active occupants (400).
- A room with any occupancy or maintenance history cannot be deleted. Return 400 "Set the room to inactive instead".

**D7. Tenants.**
- A tenant with an active occupancy cannot be set to `inactive` (400).
- A tenant with any occupancy, billing or payment history cannot be deleted (400 "Set the tenant to inactive instead").
- `GET /api/tenants/:id` returns:
  - the tenant
  - current occupancy (with room)
  - occupancy history
  - bills with derived balances
  - `totalOutstanding`

**D8. Creating a bill** (`services/billingService.js`).
- The client sends `occupancy`, `billingPeriod`, `dueDate`, and optionally `rentAmount`, `utilityAmount`, `otherCharges`, `discount`.
- The occupancy must exist (404) and be `active` (400).
- `tenant` is copied from the occupancy. The client never sends it.
- `rentAmount` defaults to the occupancy's `agreedMonthlyRate`.
- `total = rent + utilities + other − discount`. If the total would be negative, return 400 "Discount cannot exceed total charges".
- A second bill for the same occupancy and period returns 400 "A bill for this period already exists".

**D9. Derived bill fields.** Every bill returned by the API includes `total`, `totalPaid`, `remainingBalance`, `status`, and `daysOverdue` (0 if not overdue).
- Status:
  - `paid` if remainingBalance is 0
  - else `overdue` if `dueDate` is before today
  - else `partial` if totalPaid > 0
  - else `unpaid`
- `GET /api/billings?status=` filters after deriving.
- `GET /api/billings/overdue` returns only overdue bills, sorted by `daysOverdue` descending.

**D10. Changing or deleting a bill.**
- Once a bill has any payment, `rentAmount`, `utilityAmount`, `otherCharges` and `discount` cannot change (400). `dueDate` can still change.
- A bill with payments cannot be deleted (400).

**D11. Payments.**
- The client sends `billing`, `amount`, `paymentDate`, `method`, and optionally `referenceNumber` and `notes`.
- `tenant` is copied from the bill.
- The amount must be ≥ 0.01 and ≤ the bill's `remainingBalance`. If it is higher, return 400 with a message stating the remaining balance.
- A payment on a bill that is already fully paid returns 400.
- The response includes the payment and the recomputed bill.
- `DELETE` removes the payment, and the bill's derived values update automatically.

**D12. Payment list filters:** `billing`, `tenant`, `method`, `from`, `to`.

**D13. Maintenance** (`utils/maintenanceTransitions.js`).
- Allowed: open→in_progress, open→cancelled, in_progress→resolved, in_progress→cancelled. Anything else returns 400 with the allowed next statuses in the message.
- Resolving requires `resolutionNotes` and sets `resolvedAt` = now.
- `PUT` never changes `status`.
- A `tenant` given on a request must exist (404).

**D14. Detail payloads.** `GET /api/rooms/:id` includes:
- the room
- availability fields (D3)
- current tenants
- occupancy history
- maintenance history

**D15. Dashboard summary.** `GET /api/dashboard/summary` returns:
- `totalRooms`, `totalCapacity`, `occupiedSlots`, `vacantSlots`, `occupancyRate` (active rooms only)
- `collectionsThisMonth`: the sum of payments dated in the current month
- `totalOutstanding`: the sum of remaining balances
- `overdueCount`
- `openMaintenance`: open + in_progress, plus how many of those are `urgent`
- `roomsNearCapacity`: active rooms at 75% or more and not yet full

**D16. Reports.**
- **revenue** (`from`, `to` optional; invalid or reversed dates return 400): total collected, `byMonth` `[{ month: "YYYY-MM", total }]`, `byMethod` `[{ method, total, count }]`.
- **occupancy**: per active room (`roomNumber`, `capacity`, `activeOccupants`, `occupancyRate`), per `roomType` totals, and the overall rate.
- **maintenance**: counts by status, counts by priority, and `averageResolutionDays` over resolved requests (`resolvedAt − dateReported`, 1 decimal; `null` if none).
- **outstanding**: every bill with `remainingBalance > 0`, with tenant name, room number, period, balance and daysOverdue. Sorted by daysOverdue descending, then balance descending, plus a `totalOutstanding`.

**D17. List filters.**
- rooms: `search` (roomNumber or floor), `roomType`, `conditionStatus`
- tenants: `search` (name, email, phone), `status`
- occupancies: `status`, `room`, `tenant`
- billings: `billingPeriod`, `status`, `tenant`
- maintenance: `status`, `priority`, `room`

`sort` accepts one field name with an optional `-` prefix.

---

## 10. Seed data (`npm run seed` in server/, by Miguel)

Clears all six collections, then inserts **clearly sample** data:
- **10 rooms** across 3 floors:
  - 2 single, 3 double, 5 shared (capacity 4–6)
  - one room in `maintenance`, one `inactive`
- **18 tenants** with sample Filipino names and `09…` numbers; 2 of them `inactive`.
- **Occupancies** that respect every rule:
  - at least one room exactly full, and one room at 75% or more but not full
  - several completed occupancies
- **Billings for the last 3 months** for active occupancies, with payments so the data includes `paid`, `partial`, `unpaid` and `overdue` bills.
- **Payments** across all four methods.
- **10 maintenance requests** across all statuses and priorities, including resolved ones with `resolvedAt`.

Rules:
- All dates are relative to the day the seed runs, so the demo looks right on any date.
- Prints counts at the end. Never prints the URI.

---

## 11. README.md (John Paul; required content)

- Project title, group members (§1) and concept
- What the application does and what data it processes
- Screenshots from `docs/screenshots/`
- Setup instructions and the required environment variables (both `.env.example` files)
- API documentation table with **method, path, purpose, sample request, sample response** for all 40 endpoints, taken from the real running API
- List of features
- Known limitations and assumptions (include §9 and the out-of-scope items in §0.1)
- The data flow: React page → axios → Express route → controller → service → Mongoose → MongoDB → JSON → React

Do not write a per-member contribution list. The group writes that themselves.

---

## 12. Phases (one at a time; each checkpoint has ONE owner; push at the end of each phase)

**Phase 1: Server foundation.**
- **CP1.1 [Miguel]:**
  - root `.gitignore`
  - `server/package.json`, `server/.env.example`
  - `config/db.js`, `server.js`
  - `app.js` (§6 order)
  - `middleware/logger.js`, `middleware/notFound.js`, `middleware/errorHandler.js`
  - `utils/httpError.js`, `utils/validateId.js`
  - `server/.env` per §0.7
  - Confirm MongoDB connects.
- **CP1.2 [Miguel]:** the 8 route files and 8 controller files as empty stubs, mounted in `app.js`. Confirm unknown routes return a JSON 404.

**Phase 2: Client foundation.**
- **CP2.1 [Miguel]:** Vite React TypeScript in `client/`, Tailwind v4 with the §8 theme, `client/.env.example`, and `client/.env` (after `git check-ignore client/.env` confirms it is ignored).
- **CP2.2 [Miguel]:** `api/axios.ts`, `hooks/useApi.ts`, `hooks/useDebounce.ts`, `utils/format.ts`, and all shared UI components.
- **CP2.3 [Miguel]:** layout (sidebar, mobile menu, logo), and React Router with **all 12 routes** pointing to placeholder page files. The Not Found page is finished.

**Phase 3: Models and services.**
- **CP3.1 [Erin]:** `models/Room.js` (D6 type–capacity rule), `models/Tenant.js`, `services/roomService.js` (D3)
- **CP3.2 [Miguel]:** `models/Occupancy.js`, `services/occupancyService.js` (D4, D5)
- **CP3.3 [Pio]:** `models/Billing.js`, `models/Payment.js`, `utils/calculations.js`, `services/billingService.js` (D8–D11)
- **CP3.4 [John Paul]:** `models/MaintenanceRequest.js`, `utils/maintenanceTransitions.js` (D13)

**Phase 4: Endpoints.** Each checkpoint includes curl tests for success, 400 and 404.
- **CP4.1 [Erin]:** rooms (7)
- **CP4.2 [Erin]:** tenants (5)
- **CP4.3 [Miguel]:** occupancies (7)
- **CP4.4 [Pio]:** billings (6)
- **CP4.5 [Pio]:** payments (4)
- **CP4.6 [John Paul]:** maintenance-requests (6)
- **CP4.7 [John Paul]:** dashboard summary, occupancy report, maintenance report (3)
- **CP4.8 [Pio]:** revenue report, outstanding report (2)
- Confirm the total is 40.

**Phase 5: Seed.**
- **CP5.1 [Miguel]:** `seed/seed.js` (§10). Run it, then show the dashboard summary, the overdue list and the room availability proving the required demo cases exist.

**Phase 6: Pages.** Each checkpoint is checked against §8 at 375px and on desktop, and includes its Zod schemas and request functions.
- **CP6.1 [John Paul]:** Landing page
- **CP6.2 [Erin]:** Rooms and Room details
- **CP6.3 [Erin]:** Tenants and Tenant details
- **CP6.4 [Miguel]:** Occupancies page
- **CP6.5 [Pio]:** Billing page
- **CP6.6 [Pio]:** Payments page
- **CP6.7 [John Paul]:** Maintenance page
- **CP6.8 [John Paul]:** Dashboard
- **CP6.9 [Pio]:** Reports page

**Phase 7: Finish.**
- **CP7.1 [John Paul]:** README (§11) and the screenshots in `docs/screenshots/`.
- **CP7.2:** run the §13 checklist and report pass or fail. Each fix is its own checkpoint, owned by whoever owns that file above.

---

## 13. Definition of done (rubric checklist)

**Collections and validation**
- [ ] 6 related collections with required, min, max, enum, default and unique rules and timestamps.
- [ ] The seed makes the app look complete.

**API structure**
- [ ] 40 endpoints, all working. Full CRUD on rooms. Correct REST naming.
- [ ] Processing in §4 is correct, including the §9 edge cases.
- [ ] Status codes are only 200, 201, 400, 404 and 500. JSON errors are `{ message }`.
- [ ] Invalid IDs and validation errors return 400.
- [ ] Logger, 404 catch-all and error handler are in the right order. CORS is set.
- [ ] `.env` and `node_modules` are not tracked. `.env.example` files are committed.
- [ ] Clean structure: routes, controllers, models, services, middleware; components, hooks, schemas, pages.

**Frontend**
- [ ] 12 pages, including the landing page and the 404 page.
- [ ] One axios instance.
- [ ] Loading, error and empty states everywhere.
- [ ] Zod schemas outside components with `z.infer`, per-field errors and gated submit.
- [ ] Delete confirmation and success feedback.
- [ ] `_id` keys, derived values computed in render, and the custom hook.
- [ ] Usable at 375px with no horizontal scroll. Consistent design from the Tailwind theme.

**README and demo**
- [ ] README has every item in §11.
- [ ] The demo can show validation errors:
  - assigning a tenant to a full room (400 shown in the UI)
  - a payment above the balance
  - an empty form (Zod errors)
- [ ] The demo can show a not-found case: `/rooms/000000000000000000000000` shows "not found", and an unknown URL shows the 404 page.
