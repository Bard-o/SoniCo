# SoniCo — Design Prompt for Loveable

> This document is structured screen by screen. Send each section as a separate prompt to Loveable.
> The Design System is already loaded. Do not re-specify colors, typography, or spacing — apply the loaded system.
> Screens are ordered to maximize component reuse. Build earlier screens first.

---

## Context to include at the top of every prompt

```
You are designing SoniCo, a web app for managing a music rehearsal studio.
The design system is already loaded. Apply it consistently.
This prompt covers one screen. Do not build other screens.
Reuse any components already generated in this project.
```

---

---

# BLOCK 1 — Auth & Shell
*Build these first. They establish the global layout shell and auth forms used everywhere.*

---

## Screen 1 — Login

**Purpose:** Allow existing users to authenticate.

**Layout:**
- Centered card on a full-height page.
- Studio logo or wordmark at the top of the card.

**Components:**
- Email input field.
- Password input field with show/hide toggle.
- "Sign in" primary button — full width.
- Divider with label "or".
- "Continue with Google" button with Google icon — full width.
- Link: "Don't have an account? Register."
- Link: "Forgot your password?" (no functionality needed for MVP — just the link).

**States:**
- Default, loading (button), error (inline message below the form — e.g. "Incorrect email or password").

---

## Screen 2 — Register

**Purpose:** Allow new users to create an account.

**Layout:** Same centered card structure as Login.

**Components:**
- Full name input.
- Email input.
- Password input with show/hide toggle.
- Confirm password input.
- "Create account" primary button — full width.
- Divider with label "or".
- "Continue with Google" button — full width.
- Link: "Already have an account? Sign in."

**States:**
- Default, loading, error (inline per field — e.g. "Passwords do not match").

---

## Screen 3 — Global Layout Shell (Authenticated)

**Purpose:** The persistent wrapper for all authenticated screens. Build this as a layout component.

**Top Navbar:**
- Left: Studio logo / wordmark — links to home.
- Center (or left-aligned after logo): Navigation links. For regular users: "Rooms", "Rent Equipment", "My Reservations", "My Rentals". For owners: different set (specified in owner screens block).
- Right: Notification bell icon with unread count badge (red dot or number). User avatar or initials with a dropdown: "My Profile" (placeholder), "Sign out".

**Notification Bell Behavior:**
- Clicking the bell opens a dropdown panel anchored to the bell icon.
- Panel: scrollable list of notifications, newest first. Each row: icon (by type), message text, relative timestamp (e.g. "2 hours ago"), unread indicator (dot or bold). At the top of the panel: "Mark all as read" text button.
- Empty state: icon + "No notifications yet."
- Panel closes on outside click.

**Main Content Area:**
- Full width below navbar. Padding consistent with the design system.

**Footer (optional):** Minimal — studio name and year.

---

---

# BLOCK 2 — User Flows
*These screens are what regular users interact with after login.*

---

## Screen 4 — Rental Catalog (Public + Authenticated)

**Purpose:** Browse equipment available for rent. Add items to a cart. This screen is accessible without login but requires login to proceed to rental request.

**Layout:**
- Page title: "Rent Equipment."
- Category filter chips row: horizontal scrollable row of chips (one per category: Drums, Guitar Amps, Bass Amps, Keyboards, Microphones, Audio Console, Speakers, Guitar Pedals, Cables & Accessories, Other). "All" chip selected by default.
- Item grid: 2–4 columns depending on screen size.

**Item Card (reusable component):**
- Photo (with placeholder if none).
- Item name.
- Category label/chip.
- Rental price (per rental period — label TBD).
- "Add to cart" button. When added: button changes to a quantity selector (− / count / +) with a remove option.

**Cart Summary (sticky or sidebar):**
- Appears when at least one item is in the cart.
- Lists selected items with quantities and a subtotal.
- "Request Rental" CTA button — proceeds to rental request flow (requires login).

**States:**
- Empty catalog (no items match filter): illustrated empty state.
- Loading: skeleton cards.

---

## Screen 5 — Request Room Reservation Flow

**Purpose:** Multi-step flow for a user to request a room booking.

> This is a multi-step flow. Build it as a stepped component with a progress indicator (Step 1 of 3, etc.).

### Step 1 — Select Date, Time & Duration

**Components:**
- Room name and photo shown at top (passed from Room Detail page — room is pre-selected).
- Date picker — calendar view, single date selection.
- Start time selector — dropdown or time wheel showing only :00 and :30 options within studio operating hours.
- Duration selector — number of half-hours (minimum 2). Display as "1 hour", "1.5 hours", "2 hours", etc.
- Computed end time shown automatically as read-only.
- Weekly mini-calendar or availability indicator showing which slots on the selected date are taken (confirmed reservations only, read-only, same component as Room Detail calendar if possible).
- "Next" button.

**States:**
- Validation: selected time outside operating hours (error), duration too short (error).

### Step 2 — Add Items (Optional)

**Components:**
- Section title: "Add equipment to your session (optional)."
- List of items NOT already included in the room, grouped by category.
- Each item: photo, name, availability indicator for selected time window, quantity selector.
- Items unavailable for the selected window are shown as disabled with a label "Not available for this time."
- "Skip" and "Next" buttons.

### Step 3 — Confirm Request

**Components:**
- Summary card: room name, date, time range, duration, add-on items with quantities, band name field (optional text input), total price breakdown.
- "Submit Request" primary button.
- "Back" link.

**States:**
- Loading (submit in progress).
- Success: full-page or modal confirmation — "Your request has been submitted. You'll be notified once the studio confirms it." With a link to "My Reservations."

---

## Screen 6 — Request Equipment Rental Flow

**Purpose:** Multi-step flow to confirm a rental request after building cart on the Rental Catalog.

> Build as a stepped component.

### Step 1 — Review Cart & Pick Datetime

**Components:**
- Cart summary (items, quantities) — editable (can adjust quantities or remove items).
- Date + time pickers: start datetime and end datetime. Only :00 and :30 options. End must be at least 3 hours after start and no more than 48 hours.
- Computed duration shown as read-only.
- "Next" button.

**States:**
- Duration too short / too long: inline error.

### Step 2 — Details & Confirm

**Components:**
- Band or event name input (optional).
- Details textarea (optional) — placeholder: "Event date, venue, or any relevant details."
- Full summary: items, datetime, band/event name, total price.
- "Submit Request" primary button.
- "Back" link.

**States:**
- Success state same pattern as room reservation confirmation.

---

## Screen 7 — My Reservations

**Purpose:** User's personal list of room reservation requests and bookings.

**Layout:**
- Page title: "My Reservations."
- Filter tabs or chips: All / Pending / Confirmed / Denied / Cancelled.
- Sorted by: upcoming first, then past.

**Reservation Card (reusable component):**
- Room photo (small thumbnail).
- Room name.
- Date and time range (Bogota timezone).
- Duration.
- Band name (if set).
- Add-on item count (e.g. "2 add-ons").
- Status badge: Pending / Confirmed / Denied / Cancelled — visually distinct.
- Action buttons depending on status:
  - Pending: "Withdraw Request" (destructive, with confirmation).
  - Confirmed (and within cancellation window): "Cancel Reservation."
  - Denied or Cancelled: view only.
- Clicking the card opens Reservation Detail.

**States:**
- Empty state per filter tab.
- Loading skeletons.

---

## Screen 8 — Reservation Detail

**Purpose:** Full detail view of a single room reservation.

**Layout:** Single-column detail page or slide-over panel.

**Components:**
- Room name + photo.
- Status badge (prominent).
- Date, time range, duration.
- Band name (if set).
- Included room items list (grouped by category, read-only).
- Add-on items list (if any).
- Price breakdown.
- Owner message box — shown only if `owner_message` is set. Label: "Message from the studio." Visually distinct (e.g. quoted block).
- Action button (same logic as card): Withdraw / Cancel / none.
- "Back to My Reservations" link.

---

## Screen 9 — My Rentals

**Purpose:** User's personal list of equipment rental requests.

**Layout:** Same pattern as My Reservations (Screen 7). Reuse the filter tabs and card structure.

**Rental Card:**
- List of items (first 2–3 items shown, "+ N more" if many).
- Date and time range.
- Band or event name (if set).
- Status badge.
- Action buttons: same logic as reservations (Withdraw / Cancel / view only).

---

## Screen 10 — Rental Detail

**Purpose:** Full detail of a single equipment rental request.

**Layout:** Same pattern as Reservation Detail (Screen 8). Reuse the structure.

**Components:**
- Full item list with quantities.
- Start and end datetime.
- Duration.
- Band or event name (if set).
- Details text (if set).
- Price breakdown.
- Owner message box (if set).
- Action button.

---

---

# BLOCK 3 — Owner / Admin Screens
*Build after user screens. Owner navbar differs from user navbar.*

---

## Screen 11 — Owner Navbar (Layout Variant)

**Purpose:** Override the user navbar for authenticated owners. Build as a variant of the Global Layout Shell (Screen 3).

**Owner Navbar Links:** Dashboard, Pending Requests (with count badge), Calendar, Reservations, Rentals, Rooms, Items, Settings.

**Everything else** (notification bell, avatar dropdown) remains the same.

---

## Screen 12 — Owner Dashboard

**Purpose:** Quick overview and fast access to what needs attention.

**Layout:**
- Page title: "Dashboard."
- Top row: stat cards (large, prominent).
- Below: quick-access sections.

**Stat Cards:**
- Pending Requests (most prominent — highlighted if count > 0).
- Confirmed Reservations This Week.
- Confirmed Rentals This Week.
- Active Rooms.

**Quick Access Sections:**
- "Recent Pending Requests" — list of the 3–5 most recent pending requests (compact cards). "View all" link.
- "Today's Confirmed Reservations" — compact timeline or list of today's bookings. Empty state if none.

---

## Screen 13 — Pending Requests

**Purpose:** The owner's primary action screen. All pending reservation and rental requests in one place.

**Layout:**
- Page title: "Pending Requests."
- Toggle or tabs: "Rooms" / "Equipment Rentals" / "All."
- Sorted by: oldest first (submitted first = reviewed first).

**Pending Request Card:**
- Type icon (room or equipment).
- User full name.
- Room name (for reservations) or item list preview (for rentals).
- Requested datetime range.
- Band or event name (if set).
- Submitted timestamp (relative: "3 hours ago").
- Two action buttons: "Approve" (primary) and "Deny" (secondary/destructive).
- Clicking the card expands it or opens a detail panel showing full info.

**Approve Action:**
- Opens a confirmation modal.
- Optional message textarea: "Add a message to the user (optional)."
- If approving would auto-deny other pending requests: warning banner inside the modal — "Approving this will automatically deny X other pending request(s) for the same time slot." List the affected users.
- "Confirm Approval" button.

**Deny Action:**
- Opens a confirmation modal.
- Message textarea: "Reason for denial (optional but recommended)."
- "Confirm Denial" button.

**States:**
- Empty state: "No pending requests. You're all caught up." with an appropriate illustration.

---

## Screen 14 — Owner Calendar View

**Purpose:** Visual overview of all confirmed reservations across rooms.

**Layout:**
- Page title: "Calendar."
- Controls row: room selector (multi-select chips, each room in a distinct color), week navigation (prev/next week, "Today" button), current week label.
- Full-width weekly calendar grid below.

**Calendar Grid:**
- 7 columns (Mon–Sun), rows in 30-minute slots.
- Time labels on the left axis (e.g. 8:00, 8:30, 9:00...).
- Each confirmed reservation rendered as a colored block spanning its time range, in the column of its day.
- Block content: user name, band name (if set), time range. Truncate gracefully if block is short.
- Current time: horizontal line across all columns.
- Clicking a block opens a detail side panel.

**Block Detail Side Panel:**
- User name + contact info.
- Room name.
- Date, time range, duration.
- Band name (if set).
- Add-on items (if any).
- Status badge (always Confirmed here).
- Action buttons: "Cancel Reservation" (with confirmation modal and optional message).

**States:**
- No confirmed reservations in the week: empty grid with subtle illustration or message.

---

## Screen 15 — All Reservations (Owner)

**Purpose:** Full searchable and filterable list of all reservations across all users.

**Layout:**
- Page title: "All Reservations."
- Controls row: search input (by user name or band name), status filter (All / Pending / Confirmed / Denied / Cancelled), date range filter.
- Results list below.

**Reservation Row / Card:**
- User name.
- Room name.
- Date and time range.
- Band name (if set).
- Status badge.
- "View Detail" action.

**Reservation Detail (owner view):**
- Same as Screen 8 (Reservation Detail) but with owner actions: "Cancel" (if confirmed), and the owner message field is editable.

**States:**
- Empty state per filter combination.
- Loading skeletons.

---

## Screen 16 — All Rentals (Owner)

**Purpose:** Same pattern as All Reservations but for equipment rentals. Reuse all components from Screen 15.

**Differences from All Reservations:**
- Shows items list instead of room name.
- Shows band or event name instead of band name only.
- Detail view mirrors Screen 10 (Rental Detail) with owner cancel action.

---

## Screen 17 — Room Management

**Purpose:** Owner CRUD for rehearsal rooms.

**Layout:**
- Page title: "Rooms."
- "Add Room" button (top right).
- Grid or list of existing rooms.

**Room Card (management view):**
- Room photo (first photo or placeholder).
- Room name.
- Price per half-hour.
- Status toggle (Active / Inactive) — inline, immediate.
- "Edit" and "Delete" actions.

**Room Form (Add / Edit — modal or dedicated page):**
- Name input.
- Description textarea.
- Photo uploader: drag-and-drop or file picker. Shows up to 4 thumbnails. Remove individual photos. Max 3 MB each, JPEG/PNG/WebP only.
- Price per half-hour input.
- Active status toggle.
- **Linked Items section:**
  - List of currently linked items (name, category, quantity assigned). "Remove link" per item.
  - "Add item" — opens a searchable dropdown/modal of all items. Owner selects item and specifies quantity to assign.
- **Maintenance Blocks section:**
  - List of upcoming maintenance blocks for this room (start/end, reason). "Delete" per block.
  - "Add Maintenance Block" button — opens a sub-form: start datetime, end datetime, reason (internal only). Warning shown if any confirmed reservations overlap.
- Save / Cancel buttons.

**Delete Room:**
- Confirmation modal: "Are you sure? This cannot be undone."

---

## Screen 18 — Item Management

**Purpose:** Owner CRUD for all inventory items.

**Layout:**
- Page title: "Items."
- Category filter chips (same as Rental Catalog — reuse component).
- "Add Item" button (top right).
- Grid or list of items.

**Item Card (management view):**
- Photo or placeholder.
- Item name.
- Category chip.
- Total quantity.
- Addon price / Rental price (shown as two lines).
- "Edit" and "Delete" actions.

**Item Form (Add / Edit):**
- Name input.
- Description textarea.
- Category selector (dropdown or segmented control).
- Photo uploader (same component as Room Form — reuse).
- Total quantity input (integer ≥ 1).
- Add-on price input (price per room reservation).
- Rental price input (price per standalone rental).
- "Available for rental" toggle.
- "For sale" toggle — when enabled: sale price input appears.
- Save / Cancel buttons.

**Availability indicator (read-only, in edit form):**
- Show current room links: "X units linked to [Room Name]." List all links. Clicking a link navigates to that room's edit form.

**Delete Item:**
- Confirmation modal. If item is currently linked to any room, show warning: "This item is linked to X room(s). Removing it will unlink it from all rooms."

---

## Screen 19 — Studio Settings

**Purpose:** Owner configuration of global studio parameters.

**Layout:**
- Page title: "Studio Settings."
- Single-column form, grouped in sections.

**Section: Studio Info**
- Studio name input.
- Studio description textarea.

**Section: Operating Hours**
- 7 rows, one per day of week (Monday–Sunday).
- Each row: day label, toggle (Open / Closed), open time selector (only :00/:30 options), close time selector (only :00/:30 options). Time selectors disabled when day is toggled Closed.

**Section: Booking Policy**
- Minimum cancellation hours — number input with label "Minimum hours before start time that a user can cancel." Helper text explaining what it means.

**Save Changes button** — full section or sticky at bottom.

**States:**
- Success toast on save.
- Unsaved changes indicator (optional — subtle) if user navigates away.

---

---

# Component Inventory (reference)

> These are the shared components that emerge from the screens above. Build each once and reuse.

| Component | First appears in |
|---|---|
| Status Badge (Pending/Confirmed/Denied/Cancelled) | Screen 7 |
| Reservation Card | Screen 7 |
| Reservation Detail view | Screen 8 |
| Rental Card | Screen 9 |
| Rental Detail view | Screen 10 |
| Notification Bell + Panel | Screen 3 |
| Photo Uploader (max 4, 3MB, drag-drop) | Screen 17 |
| Category Filter Chips | Screen 4 |
| Item Card | Screen 4 |
| Cart Summary | Screen 4 |
| Datetime Picker (:00/:30 only) | Screen 5 |
| Availability Calendar (30-min slots) | Screen 5 (reuse from Room Detail) |
| Confirm Modal with optional message | Screen 13 |
| Maintenance Block Form | Screen 17 |
| Owner Weekly Calendar Grid | Screen 14 |
| Studio Hours Editor | Screen 19 |
