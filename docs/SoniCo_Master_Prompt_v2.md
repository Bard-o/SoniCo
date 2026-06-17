# SoniCo — Master Development Prompt v2.0

> Single-studio MVP · React + TypeScript + Supabase  
> Read this entire document before writing any code. Follow the data model exactly.  
> Do not add features not described here. Deferred features are listed in Section 9.

---

## 1. Project Overview

SoniCo is a web-based management system for a single music rehearsal studio — rooms for bands to practice, not mastering or production. Two roles exist: regular users who request room bookings and gear rentals, and the studio owner who manages inventory, rooms, pricing, and approves or denies all reservations.

**This MVP is scoped to a single studio. Multi-tenant support is intentionally deferred. The system should be architected cleanly but without a tenant layer.**

### Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (TypeScript) + Tailwind CSS + Vite |
| Database | Supabase — PostgreSQL |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Storage | Supabase Storage (photos) |
| Backend Logic | Supabase Edge Functions (TypeScript / Deno) |
| Email | Resend API (called from Edge Functions) |

### Environment Setup

Provide a `.env.example` with all variable names and comments. Copy to `.env` and fill values. Never commit `.env`.

```
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=       # used only in Edge Functions, never exposed to client
RESEND_API_KEY=
STUDIO_TIMEZONE=America/Bogota   # UTC-05:00
```

> **Owner access:** granted manually — set the user's `role` field to `'owner'` in the `profiles` table after they register normally. No special signup flow needed for MVP.

> **Edge Functions** use the `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for complex business logic (approval flows, cascade cancellations, maintenance blocks). This key must never be exposed to the client.

---

## 2. Data Model

### Profiles (extends Supabase Auth users)

| Field | Details |
|---|---|
| id | UUID — matches Supabase Auth `auth.users.id` |
| email | string, unique |
| full_name | string |
| phone | string, optional |
| role | enum: `user` \| `owner` — default: `user`, set manually in DB |
| created_at | timestamp |

---

### Rooms

| Field | Details |
|---|---|
| id | UUID |
| name | string |
| description | text |
| photos | array of Supabase Storage URLs — max 4, each ≤ 3 MB |
| price_per_half_hour | decimal |
| is_active | boolean — owner toggle |
| created_at / updated_at | timestamps |

---

### Items

Items are **global** — not room-exclusive. An item is linked to a room via a `RoomItem` join record.

> **CRITICAL linking rule:** When `quantity` units of an item are assigned to a room via `RoomItem`, exactly those units are unavailable for rental or add-on use. If `item.quantity = 5` and `RoomItem.quantity = 2`, then 3 units remain available for rental or add-on. If all units are linked to rooms, the item cannot be rented or added as an add-on until units are unlinked.

| Field | Details |
|---|---|
| id | UUID |
| name | string |
| description | text |
| category | enum (see Item Categories below) |
| photos | array of Supabase Storage URLs — max 4, each ≤ 3 MB |
| quantity | integer ≥ 1 — total units owned by the studio |
| price_addon | decimal — price to add to a room reservation |
| price_rental | decimal — price for standalone equipment rental |
| is_available_for_rental | boolean — owner controls |
| is_for_sale | boolean — optional flag |
| sale_price | decimal — optional, only relevant if `is_for_sale` is true |
| created_at / updated_at | timestamps |

### Item Categories (Enum)

All items must belong to exactly one of these categories:

- Amplifiers
- Guitars & Basses
- Percussion & Drums
- Keyboards & Synthesizers
- Studio Monitors & Speakers
- Microphones
- Mic Stands & Hardware
- Signal Processing & Effects Units
- Audio Interfaces & Converters
- Mixing Consoles & Control Surfaces
- Recording Devices
- Cables & Adapters
- Headphones & In-Ear Monitors
- Headphone Amps / Distribution Systems
- Power Management
- Computers & Workstations
- Software & Licenses
- Acoustic Treatment
- Furniture & Stands
- Miscellaneous Accessories
---

### Item Availability Logic

> **CRITICAL: Item availability is NOT a simple boolean. It is computed dynamically at the moment of approval, not at the moment of request.**

To check if N units of an item are available for a given time window [start, end]:

1. Calculate units locked in rooms: sum of `RoomItem.quantity` for all `RoomItem` records linking this item to any active room.
2. Available pool = `item.quantity - locked_in_rooms`
3. From that pool, subtract units already committed: query all `ReservationItem` and `RentalItem` records where `item_id` matches AND their parent reservation/rental overlaps with [start, end] AND status is `confirmed`.
4. If `committed_units + N ≤ available_pool`, the item is available.
5. Also query `MaintenanceBlock` records for the item. A maintenance block treats the full `item.quantity` as blocked for its duration.

This logic runs inside an Edge Function. It is **never** computed on the client.

---

### Room-Item Link (RoomItem)

| Field | Details |
|---|---|
| id | UUID |
| room_id | FK → Room |
| item_id | FK → Item |
| quantity | integer — how many units of this item are assigned to this room |

---

### Reservations (Room Bookings)

> **Terminology:** Users **request** a reservation. The owner **approves** or **denies** it. A reservation is only `confirmed` after owner approval.

| Field | Details |
|---|---|
| id | UUID |
| user_id | FK → Profile |
| room_id | FK → Room |
| band_name | string, optional |
| start_datetime | timestamptz — must be on :00 or :30 boundary |
| duration_half_hours | integer ≥ 2 (minimum 1 hour) |
| end_datetime | computed: start + duration × 30 min |
| status | enum: `pending` \| `confirmed` \| `denied` \| `cancelled` |
| owner_message | text, optional — message from owner when approving or denying |
| created_at / updated_at | timestamps |

> **All datetimes stored in UTC, displayed in America/Bogota (UTC-05:00). The UI must enforce :00 and :30 minute boundaries.**

> **Pending reservations do NOT appear on the public or owner calendar. Only `confirmed` reservations are shown on the calendar.**

---

### Reservation Add-ons (ReservationItem)

| Field | Details |
|---|---|
| id | UUID |
| reservation_id | FK → Reservation |
| item_id | FK → Item |
| quantity | integer |

---

### Equipment Rentals

> **Same approval flow as Reservations.** Users request a rental, owner approves or denies it.

| Field | Details |
|---|---|
| id | UUID |
| user_id | FK → Profile |
| band_or_event_name | string, optional |
| details | text, optional — event date, venue, or other relevant context |
| start_datetime | timestamptz — :00 or :30 boundary |
| end_datetime | timestamptz — :00 or :30 boundary |
| status | enum: `pending` \| `confirmed` \| `denied` \| `cancelled` |
| owner_message | text, optional |
| created_at / updated_at | timestamps |

Minimum rental duration: **3 hours**. Maximum: **48 hours**. Store these as named constants in a `src/config/constants.ts` file.

---

### Rental Items (RentalItem)

| Field | Details |
|---|---|
| id | UUID |
| rental_id | FK → Rental |
| item_id | FK → Item |
| quantity | integer |

---

### Maintenance Blocks

| Field | Details |
|---|---|
| id | UUID |
| item_id | FK → Item (nullable) |
| room_id | FK → Room (nullable) |
| start_datetime | timestamptz |
| end_datetime | timestamptz |
| reason | string — shown to owner only |

Either `item_id` or `room_id` must be set, not both. Room maintenance blocks must cancel all overlapping **confirmed** reservations and notify users. Pending reservations overlapping a new maintenance block are automatically denied.

---

### Studio Settings

A single-row configuration table. Never delete this row — use upsert.

| Field | Details |
|---|---|
| id | integer — always 1 |
| studio_name | string |
| studio_description | text, optional |
| hours_per_day | JSONB — `{ "monday": { "open": "09:00", "close": "22:00" }, ... }` |
| min_cancellation_hours | integer — default: 24 |
| updated_at | timestamp |

---

### Notifications

| Field | Details |
|---|---|
| id | UUID |
| user_id | FK → Profile |
| type | enum: `reservation_requested` \| `reservation_confirmed` \| `reservation_denied` \| `reservation_cancelled` \| `rental_requested` \| `rental_confirmed` \| `rental_denied` \| `rental_cancelled` |
| message | text |
| owner_message | text, optional — echoes the owner's message if present |
| is_read | boolean — default false |
| created_at | timestamp |

---

## 3. Row Level Security (RLS)

RLS is enabled on all tables. The following policies apply. Complex business logic that requires bypassing RLS runs in Edge Functions using the `service_role_key`.

| Table | Authenticated user (`role = 'user'`) | Owner (`role = 'owner'`) |
|---|---|---|
| `profiles` | Read + update own row only | Read all |
| `rooms` | Read active rooms only | Full CRUD |
| `items` | Read all | Full CRUD |
| `room_items` | Read all | Full CRUD |
| `reservations` | Read own rows; insert own; cancel own (if within policy) | Read + update all |
| `reservation_items` | Read own (via reservation) | Read + update all |
| `rentals` | Read own rows; insert own; cancel own (if within policy) | Read + update all |
| `rental_items` | Read own (via rental) | Read + update all |
| `maintenance_blocks` | No access | Full CRUD |
| `studio_settings` | Read only | Read + update |
| `notifications` | Read + mark-read own rows | Read all |

> **Helper function:** Create a Postgres function `get_user_role()` that reads the `role` field from `profiles` for the currently authenticated user. Use this in all RLS policies to avoid redundant joins.

---

## 4. Business Logic — Edge Functions

All functions run with `service_role_key`. They receive the authenticated user's JWT and validate the caller's role before executing.

### `approve-reservation`

**Trigger:** Owner clicks "Approve" on a pending reservation.

1. Verify caller is owner.
2. Re-check room availability for [start, end] against all **confirmed** reservations (not pending). If room is already taken, return error — owner cannot approve.
3. Re-check availability for all add-on items using the Item Availability Logic.
4. If all checks pass: set `status = 'confirmed'`.
5. Find all other `pending` reservations for the same room where time windows overlap. Set their `status = 'denied'` and `owner_message = 'Another reservation was confirmed for this time slot.'`
6. Create in-app notifications + send Resend emails for: the approved user, and all auto-denied users.

### `deny-reservation`

**Trigger:** Owner clicks "Deny" on a pending reservation.

1. Verify caller is owner.
2. Set `status = 'denied'`, save `owner_message`.
3. Create in-app notification + send email to user.

### `approve-rental`

Same logic as `approve-reservation` but for rentals. Conflict detection checks item availability across confirmed rentals and confirmed reservation add-ons.

### `deny-rental`

Same as `deny-reservation` for rentals.

### `cancel-reservation` (user-initiated)

**Trigger:** User clicks "Cancel" on a confirmed reservation in My Reservations.

**Flow:**
1. Verify caller owns the reservation.
2. Read `min_cancellation_hours` from `studio_settings` (fallback: 24 if not set).
3. Check `start_datetime` is at least `min_cancellation_hours` in the future. If not → return error: `"No puedes cancelar con menos de X horas de anticipación"`.
4. Set `status = 'cancelled'`.
5. Create in-app notification for the user: type=`reservation_cancelled`, message=`"Reserva cancelada"`.

**Error cases:**
- Reservation already cancelled → error `"Esta reserva ya fue cancelada"`
- Reservation is pending (not confirmed) → redirect to withdraw flow, not cancel
- Reservation belongs to another user → 403 Forbidden
- `min_cancellation_hours` policy violated → error with clear message

### `cancel-rental` (user-initiated)

Same logic as `cancel-reservation` but for rentals. Type: `rental_cancelled`.

### `owner-cancel-reservation`

**Trigger:** Owner clicks "Cancel" on a confirmed reservation from Calendar View or All Reservations.

**Flow:**
1. Verify caller is owner.
2. Verify reservation exists and status is `confirmed`. If not → error.
3. Set `status = 'cancelled'`. Save `owner_message` if provided.
4. Create in-app notification for the user: type=`reservation_cancelled`, message=`"Tu reserva fue cancelada por el estudio"`, include `owner_message` if set.
5. Return success.

**Error cases:**
- Reservation not found → 404
- Reservation already cancelled/denied → error `"Esta reserva no puede ser cancelada"`
- Not called by owner → 403

### `owner-cancel-rental`

Same logic as `owner-cancel-reservation` but for rentals. Type: `rental_cancelled`.

### `create-maintenance-block`

**Trigger:** Owner creates a maintenance block from Room Management or Item Management form.

**Input:** `{ room_id?, item_id?, start_datetime, end_datetime, reason }` — exactly one of `room_id` or `item_id` must be set, not both.

**Flow:**
1. Verify caller is owner.
2. Validate: `start_datetime < end_datetime`, `start_datetime` is in the future.
3. Check no existing `MaintenanceBlock` for the same resource overlaps [start, end] → error `"Ya existe un bloque de mantenimiento en ese horario"`.
4. Insert `MaintenanceBlock` record.

**If `room_id` is set (room maintenance):**
5. Find all `confirmed` reservations for this room overlapping [start, end] → set `status='cancelled'`, `owner_message='El estudio está en mantenimiento'`. Create notification type=`reservation_cancelled` for each affected user.
6. Find all `pending` reservations for this room overlapping [start, end] → set `status='denied'`, `owner_message='El estudio está en mantenimiento'`. Create notification type=`reservation_denied` for each affected user.

**If `item_id` is set (item maintenance):**
5. No cascade cancellation. Item simply becomes unavailable for new approvals during [start, end]. Show owner a warning if there are pending requests that would be affected.

**Error cases:**
- Both `room_id` and `item_id` set → 400 `"Especifica solo sala o equipo, no ambos"`
- Neither `room_id` nor `item_id` set → 400 `"Debes especificar una sala o un equipo"`
- Overlapping block exists → 409 `"Ya existe un bloque de mantenimiento en ese horario"`
- `reason` is empty → 400 `"El motivo es requerido"`

---

## 5. Approval Flow — Detailed Spec

### Request Phase (user action)

- User submits a room reservation or equipment rental request.
- System validates: room/items exist, datetimes are on :00/:30 boundary, within studio hours, duration constraints met.
- **No availability check at this stage.** Multiple users may submit conflicting requests simultaneously.
- Record inserted with `status = 'pending'`.
- Owner receives in-app notification + email: "New request from [user name] for [room/items] on [date/time]."
- User sees their request in "My Reservations / My Rentals" as "Pending Approval."

### Approval Phase (owner action)

- Owner sees all pending requests in a dedicated panel, ordered by creation date.
- Owner clicks "Approve" or "Deny" and may optionally write a message.
- On approval: `approve-reservation` or `approve-rental` Edge Function runs (see Section 4).
- On denial: `deny-reservation` or `deny-rental` Edge Function runs.
- **Conflict case on approval:** If approving would auto-deny other pending requests, the UI shows a warning modal: "Approving this request will automatically deny X other pending request(s) for the same time slot. Continue?" Owner must confirm before proceeding.

### Post-Approval

- Approved reservations appear on the calendar.
- Users receive notification (in-app + email) with the owner's message if provided.
- Auto-denied users receive notification (in-app + email) explaining the slot was taken.

---

## 6. Notification & Email System

### In-App Notifications

Bell icon in top nav with unread count badge. Panel lists all notifications newest-first with read/unread state and "mark all as read."

### Email (via Resend)

Each notification type has an email template. Emails include: reservation/rental details, owner message (if any), and a link to the relevant page.

| Trigger | Recipient | Type |
|---|---|---|
| User submits room reservation request | Owner | `reservation_requested` |
| Owner approves room reservation | User | `reservation_confirmed` |
| Owner denies room reservation | User | `reservation_denied` |
| Auto-deny due to conflict | User | `reservation_denied` |
| Owner cancels confirmed reservation | User | `reservation_cancelled` |
| User cancels own reservation | User (confirmation) | `reservation_cancelled` |
| Owner removes add-on item from reservation | User | `item_removed` |
| User submits rental request | Owner | `rental_requested` |
| Owner approves rental | User | `rental_confirmed` |
| Owner denies rental | User | `rental_denied` |
| Owner cancels rental | User | `rental_cancelled` |
| User cancels own rental | User (confirmation) | `rental_cancelled` |
| Room maintenance block created | All affected users | `reservation_cancelled` / `reservation_denied` |
| Owner cancels reservation via calendar | User | `reservation_cancelled` |
| Owner cancels rental via list | User | `rental_cancelled` |

---

## 7. Business Rules

### Time & Scheduling

- All datetimes stored in UTC.
- All datetimes displayed in `America/Bogota` (UTC-05:00).
- Reservations and rentals must start and end on :00 or :30 minute boundaries.
- Reservations: minimum 1 hour (2 half-hours). No defined maximum for MVP.
- Rentals: minimum 3 hours, maximum 48 hours. Defined in `src/config/constants.ts`.
- Requests outside studio operating hours (from `studio_settings.hours_per_day`) are rejected.

### Cancellation Policy

- Users can cancel their own **confirmed** reservation or rental only if `start_datetime` is at least `min_cancellation_hours` in the future.
- Users can withdraw a **pending** request at any time (before owner action).
- Owners can cancel any confirmed reservation or rental at any time.

### Photo Uploads

- Maximum 4 photos per room or item.
- Maximum file size: 3 MB per photo.
- Accepted formats: JPEG, PNG, WebP.
- Stored in Supabase Storage. URLs saved in the `photos` array field.

---

## 8. Screens & UX Flows

### Public Screens (no auth required)

- **Home / Landing** — studio info, featured rooms, call to action *(already built)*
- **Room Catalog** — grid of rooms with photo, name, price/half-hour *(already built)*
- **Room Detail** — full info, photo gallery, included items grouped by category, weekly availability calendar (confirmed reservations only, read-only), "Request Booking" button (redirects to login if unauthenticated) *(already built)*
- **Rental Catalog** — items browsable by category, each showing name, photo, rental price, add to cart

### Auth Screens

- **Login** — email/password + Google OAuth
- **Register** — name, email, password + Google OAuth

### User Screens

- **My Reservations** — list of upcoming and past room reservations with status badges (Pending / Confirmed / Denied / Cancelled). Actions: view detail, withdraw (if pending), cancel (if confirmed and within policy).
- **Reservation Detail** — full info, add-on items, status, owner message (if any).
- **My Rentals** — same pattern for equipment rentals.
- **Rental Detail** — full info, items, status, owner message (if any).
- **Request Room Reservation Flow** — (1) Select room → (2) Pick date, start time, duration → (3) Add optional items → (4) Confirm request
- **Request Equipment Rental Flow** — (1) Browse rental catalog, build cart → (2) Pick start/end datetime → (3) Add band/event name and details → (4) Confirm request
- **Notification Panel** — bell icon in navbar, expandable dropdown

### Owner / Admin Screens

- **Owner Dashboard** — pending requests count (prominent), summary stats, quick links
- **Pending Requests** — dedicated panel showing all pending reservations and rentals ordered by creation date. Each card: user name, room or items, datetime, band/event name. Actions: Approve (with optional message), Deny (with required or optional message).
- **All Reservations** — searchable/filterable list of all reservations with status filter
- **All Rentals** — searchable/filterable list of all rentals with status filter
- **Calendar View** — confirmed reservations only. Room multi-select chips + weekly calendar in 30-min slots (America/Bogota). Each block: user name, band name (if set), time range. Clicking a block opens detail panel.
- **Room Management** — list of rooms, full CRUD. Form: name, description, photos, price, status toggle, linked items manager, maintenance block creator.
- **Item Management** — list of items with category filter, full CRUD. Form: name, description, category, photos, quantity, addon price, rental price, for-sale toggle.
- **Studio Settings** — studio name, description, hours per day of week, min cancellation hours.

### Calendar View Spec

- Granularity: 30-minute slots
- Default view: current week
- Only `confirmed` reservations are shown
- Room selector: multi-select chips, each room in a distinct color
- Each reservation block: user name, band name (if set), time range
- Clicking a block opens a detail/action panel
- Current time shown as a horizontal line
- Timezone: America/Bogota (UTC-05:00)

---

## 9. Development Iterations

> **RULE: Each iteration is a standalone working deliverable. Never start iteration N+1 until N is tested and confirmed working.**

### How to prompt each iteration

```
You are building SoniCo, a music studio management system.
Here is the master spec: [attach SoniCo_Master_Prompt_v2.md]
The current codebase state is: [describe what exists or attach the repo]
This iteration scope is: [paste the relevant section below]
Follow the data model exactly. Do not add features outside this iteration scope.
```

---

### Iteration 1 — Foundation & Auth

**Scope:** Vite + React + TypeScript + Tailwind project scaffold. Supabase client setup. Supabase schema: `profiles`, `studio_settings` (with seed row). RLS policies for both tables. Auth flows: email/password register/login + Google OAuth. `.env.example`. Basic routing and layout shell (navbar with auth state, notification bell placeholder).

**Done when:** User can register, log in, log out. Owner role is assignable in DB. Navbar reflects auth state.

---

### Iteration 2 — Owner: Rooms & Items CRUD

**Scope:** Supabase schema: `rooms`, `items`, `room_items`. RLS policies. Owner UI: Room CRUD (name, description, photos, price, status toggle). Item CRUD (all fields, category enum). Photo upload to Supabase Storage. Room-Item link manager (link/unlink items with quantity). Items grouped by category in room detail view.

**Done when:** Owner can create, edit, delete rooms and items, upload photos, link items to rooms with quantities.

---

### Iteration 3 — Rental Catalog (Public)

**Scope:** Public rental catalog page. Items filtered by `is_available_for_rental = true` and not fully locked in rooms. Category filter chips. Add-to-cart state (client-side only). Item detail shows a list of its nearest upcoming confirmed reservations.

**Done when:** Non-authenticated visitor can browse rental catalog, filter by category, and add items to cart.

---

### Iteration 4 — Room Reservation Request Flow

**Scope:** Supabase schema: `reservations`, `reservation_items`. RLS policies. Request flow UI: room → datetime picker (:00/:30 enforcement, studio hours validation) → add-on items → confirm. My Reservations page with status badges. Reservation Detail page. User withdraw (pending) and cancel (confirmed, with policy check via Edge Function). Owner receives in-app notification on new request.

**Done when:** User can submit a room reservation request. It appears in My Reservations as Pending. Owner sees notification.

---

### Iteration 5 — Equipment Rental Request Flow

**Scope:** Supabase schema: `rentals`, `rental_items`. RLS policies. Rental request flow: cart → datetime picker → band/event details → confirm. My Rentals page. Rental Detail page. Same withdraw/cancel logic as reservations. Owner notification on new rental request.

**Done when:** User can submit an equipment rental request. It appears in My Rentals as Pending.

---

### Iteration 6 — Owner Approval Flow

**Scope:** Edge Functions: `approve-reservation`, `deny-reservation`, `approve-rental`, `deny-rental`. Owner Pending Requests screen (3 tabs: Todas/Salas/Alquileres). Conflict detection and warning modal (same-type auto-deny + cross-type warning). Auto-deny logic for conflicting pending requests. All approval/denial notifications (in-app only for this iteration). Inline conflict badge on pending cards. Cross-conflict detection between reservations and rentals (items shared in same time window).

**Status:** ✅ Core approval flow implemented. Edge Functions and OwnerPending UI complete. **Remaining:** Notification Bell UI, user-initiated cancel, owner-initiated cancel, maintenance blocks.

**Done when:** Owner can approve or deny any pending request. Conflicts are detected (both same-type and cross-type) and auto-resolved. Users see updated status in their dashboards. Cross-type conflicts show as warnings.

---

### Iteration 7 — Email Integration

**Scope:** Resend integration in all Edge Functions that send notifications. Email templates for all notification types (Section 6). In-app notification bell is already implemented as part of iteration 6 remaining work.

**Done when:** Users and owner receive emails for all relevant events listed in Section 6.

---

### Iteration 8 — Owner Calendar & Maintenance Blocks

**Scope:** Owner calendar view (confirmed only, multi-room, 30-min slots, click-to-detail). Maintenance block UI for rooms and items (form to create blocks). Calendar integration showing confirmed reservations with cancel action. `maintenance_blocks` schema and RLS are already covered by iteration 6 remaining work.

**Done when:** Owner can view full calendar, create maintenance blocks from room/item forms, and cancel any reservation from the calendar view.

---

### Iteration 9 — Studio Settings & Polish

**Scope:** Studio Settings UI (name, description, hours, min cancellation). Owner reservation/rental list views (searchable, filterable by status). UI polish: empty states, error handling, loading skeletons, toast notifications.

**Done when:** All features from spec are working end-to-end. No blank states, no unhandled errors.

---

## 10. Frontend Conventions

- All times displayed in America/Bogota (UTC-05:00). Never show UTC to users.
- Time pickers must only allow :00 and :30 selections.
- Item lists grouped by category with a visible category label.
- Photo galleries: max 4 thumbnails, click to enlarge. Placeholder when no photos.
- Empty states: always illustrated or iconographic — never a blank space.
- Loading states: skeleton screens, not spinners (except small inline actions).
- Toast notifications for immediate feedback (success/error) — separate from notification bell.
- Status badges: color-coded — Pending (neutral), Confirmed (positive), Denied (negative), Cancelled (muted).

---

## 11. Out of Scope for MVP

Do not implement or scaffold any of the following:

- Payment gateway (Stripe — deferred to v2)
- Multi-studio / multi-tenant support
- Item-level calendar view
- Booking modification (only cancellation/withdrawal — re-book is a new request)
- SMS notifications
- Admin analytics / revenue dashboard
- Customer-facing reviews or ratings

