# SoniCo — Iteration 1: Foundation & Auth

> **Goal:** Docker setup, Django project scaffold, Supabase connection, User model + roles, auth endpoints, `.env.example`, and a basic React app with routing and layout shell.
>
> **Done when:** User can register, log in, and log out. Owner role is assignable in DB. All services run via `docker-compose up`.

---

## Architecture Overview

```mermaid
graph LR
    subgraph Docker Compose
        FE["React (Vite)\n:5173"]
        BE["Django + DRF\n:8000"]
    end
    SB["Supabase Cloud\n(Auth + PostgreSQL)"]

    FE -- "Supabase JS SDK\n(Auth only)" --> SB
    FE -- "REST API\n(Bearer JWT)" --> BE
    BE -- "Verify JWT\n(PyJWT)" --> SB
    BE -- "psycopg2\n(ORM queries)" --> SB
```

**Key design decision:** Authentication lives entirely on the frontend via the Supabase JS SDK. The Django backend _never_ handles login/register directly — it only **verifies** the JWT that the frontend sends in `Authorization: Bearer <token>` headers. This is the standard Supabase + custom-backend pattern.

---

## User Review Required

> [!IMPORTANT]
> **Supabase Project**: You currently have **no Supabase projects**. We need to create one before starting. Your organization is **"Bard-o's Org"** (`wjjztdqjhzrtztwynshg`). I'll create the project via the MCP tool — please confirm:
> 1. **Project name**: `sonico` (or your preference)
> 2. **Region**: Which region? Options include `us-east-1`, `us-west-1`, `sa-east-1` (São Paulo), etc. Since the studio uses `America/Bogota`, **`us-east-1`** is a good low-latency choice.

> [!IMPORTANT]
> **Google OAuth**: The master prompt requires Google OAuth login. To enable this, you'll need to:
> 1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create OAuth credentials (Client ID + Secret).
> 2. Add them in the Supabase Dashboard → Authentication → Providers → Google.
> 3. This can be done _after_ this iteration ships — email/password auth will work immediately without it.

> [!WARNING]
> **Tailwind CSS**: The master prompt specifies Tailwind CSS for the frontend. I'll use **Tailwind CSS v4** (latest) with the `@tailwindcss/vite` plugin, which is the modern approach. Just flagging since your system guidelines default to vanilla CSS — but the master spec explicitly requests Tailwind.

---

## Open Questions

1. **Project region** — Which Supabase region do you prefer? I recommend `us-east-1` for proximity to Colombia.
2. **Google OAuth now or later?** — Should I scaffold the Google button (non-functional until you add credentials), or leave it out until you have the Google Cloud project set up?
3. **Studio name / branding** — Any specific studio name, logo, or color preferences for the landing shell? The master prompt doesn't specify a color palette, so I'll go with a modern dark theme with accent colors inspired by music/audio aesthetics (purple/violet gradients) unless you have a preference.

---

## Proposed Changes

### Final File Tree

```
SoniCo/
├── docker-compose.yml
├── .env.example
├── .env                          # (gitignored, user creates from .env.example)
├── .gitignore
├── README.md
│
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   └── sonico/                   # Django project
│       ├── __init__.py
│       ├── settings.py
│       ├── urls.py
│       ├── wsgi.py
│       └── asgi.py
│   └── users/                    # Django app
│       ├── __init__.py
│       ├── models.py             # User model (synced from Supabase Auth)
│       ├── serializers.py
│       ├── views.py              # /api/auth/me, /api/auth/sync
│       ├── urls.py
│       ├── authentication.py     # Custom SupabaseAuthentication class
│       ├── permissions.py        # IsOwner permission
│       └── admin.py
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx               # Router setup
│       ├── index.css             # Tailwind entry
│       ├── lib/
│       │   ├── supabase.ts       # Supabase client init
│       │   └── api.ts            # Axios instance with auth header
│       ├── contexts/
│       │   └── AuthContext.tsx    # Auth state provider
│       ├── components/
│       │   ├── layout/
│       │   │   ├── Navbar.tsx
│       │   │   ├── Sidebar.tsx
│       │   │   └── MainLayout.tsx
│       │   ├── auth/
│       │   │   └── ProtectedRoute.tsx
│       │   └── ui/
│       │       └── LoadingSkeleton.tsx
│       └── pages/
│           ├── HomePage.tsx      # Public landing
│           ├── LoginPage.tsx     # Supabase Auth UI
│           ├── RegisterPage.tsx  # Supabase Auth UI
│           ├── DashboardPage.tsx # Authenticated user home
│           └── NotFoundPage.tsx
│
└── documentation/
    └── Prompts/
        └── SoniCo_Master_Prompt.md
```

---

### Component 1: Docker Infrastructure

#### [NEW] docker-compose.yml

Two services:
- **`backend`** — Python 3.12-slim, runs `python manage.py runserver 0.0.0.0:8000`, mounts `./backend` as volume for hot reload, exposes port `8000`.
- **`frontend`** — Node 20-alpine, runs `npm run dev -- --host`, mounts `./frontend` as volume (excludes `node_modules`), exposes port `5173`.

Both services load `.env` via `env_file`. No local Postgres container needed — we connect to Supabase Cloud.

#### [NEW] .env.example

```env
# === Supabase ===
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# === Django ===
DJANGO_SECRET_KEY=change-me-to-random-string
DJANGO_DEBUG=True
STUDIO_OWNER_EMAIL=owner@example.com
STUDIO_TIMEZONE=America/Bogota

# === Frontend (Vite requires VITE_ prefix) ===
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_API_URL=http://localhost:8000/api
```

#### [MODIFY] .gitignore

Expand to include Python, Node, Docker, and `.env` patterns.

---

### Component 2: Django Backend Scaffold

#### [NEW] backend/Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

#### [NEW] backend/requirements.txt

```
django>=5.1,<6.0
djangorestframework>=3.15
django-cors-headers>=4.0
psycopg2-binary>=2.9
dj-database-url>=2.0
PyJWT>=2.8
python-dotenv>=1.0
gunicorn>=22.0
```

#### [NEW] backend/sonico/settings.py

Key configurations:
- `DATABASES` using `dj-database-url` pointing to Supabase Pooler (port 6543, SSL required, `prepare_threshold: 0`)
- `REST_FRAMEWORK` default auth class → `users.authentication.SupabaseAuthentication`
- `CORS_ALLOWED_ORIGINS` → `["http://localhost:5173"]`
- Timezone → from `STUDIO_TIMEZONE` env var

#### [NEW] backend/sonico/urls.py

```python
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/', include([])),  # Placeholder for future app URLs
]
```

---

### Component 3: User Model & Auth (Django `users` app)

#### [NEW] backend/users/models.py — `UserProfile`

```python
class UserProfile(models.Model):
    class Role(models.TextChoices):
        USER = 'user', 'User'
        OWNER = 'owner', 'Owner'

    id = models.UUIDField(primary_key=True)       # Matches Supabase Auth UID
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, default='')
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.USER)
    created_at = models.DateTimeField(auto_now_add=True)
```

> [!NOTE]
> We call it `UserProfile` (not `User`) to avoid conflicts with Django's built-in `auth.User`. This model is **synced** from Supabase Auth — the canonical auth state lives in Supabase, and this model mirrors it for Django ORM queries and permission checks.

#### [NEW] backend/users/authentication.py — `SupabaseAuthentication`

Custom DRF authentication class that:
1. Extracts the JWT from `Authorization: Bearer <token>`.
2. Decodes and verifies it using the `SUPABASE_JWT_SECRET` (HS256).
3. Extracts the Supabase `sub` (user UUID) from the payload.
4. Looks up or auto-creates a `UserProfile` record (just-in-time sync).
5. Returns `(user_profile, token)` so `request.user` is a `UserProfile` instance.

#### [NEW] backend/users/permissions.py

```python
class IsOwner(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.role == 'owner'
```

#### [NEW] backend/users/views.py

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/auth/me/` | GET | Required | Returns the current user's profile (id, email, full_name, phone, role) |
| `/api/auth/me/` | PATCH | Required | Updates full_name and phone |
| `/api/auth/sync/` | POST | Required | Explicitly syncs/creates the UserProfile from the JWT payload. Called by frontend after first login. |

#### [NEW] backend/users/serializers.py

`UserProfileSerializer` — fields: `id`, `email`, `full_name`, `phone`, `role`, `created_at`. `role` is read-only (only changeable via direct DB access per spec).

---

### Component 4: React Frontend Scaffold

#### [NEW] frontend/Dockerfile

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev", "--", "--host"]
```

#### [NEW] frontend/ (Vite + React + TypeScript)

Created via `npm create vite@latest ./ -- --template react-ts`. Then install:
- `@supabase/supabase-js` — Supabase client
- `@supabase/auth-ui-react` + `@supabase/auth-ui-shared` — Pre-built auth forms
- `react-router-dom` — Routing
- `axios` — HTTP client for Django API
- `tailwindcss` + `@tailwindcss/vite` — Styling
- `lucide-react` — Icons

#### [NEW] frontend/src/lib/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

#### [NEW] frontend/src/lib/api.ts

Axios instance that:
- Base URL: `VITE_API_URL` (`http://localhost:8000/api`)
- Interceptor: attaches Supabase session token as `Authorization: Bearer <token>` on every request

#### [NEW] frontend/src/contexts/AuthContext.tsx

React context providing:
- `user` — current Supabase user (or null)
- `profile` — `UserProfile` from Django API (or null)
- `loading` — boolean
- `signOut()` — logs out from Supabase
- Listens to `supabase.auth.onAuthStateChange` and auto-syncs profile via `/api/auth/sync/`

#### [NEW] frontend/src/components/layout/MainLayout.tsx

Shell layout with:
- **Navbar** — Logo, navigation links, auth buttons (Login/Register or User menu + Logout)
- **Sidebar** — Visible when authenticated, shows role-appropriate links (future iterations will populate)
- **Main content area** — `<Outlet />` from react-router

#### [NEW] frontend/src/pages/LoginPage.tsx

Uses `@supabase/auth-ui-react`'s `<Auth>` component configured with:
- `providers={['google']}` (Google button — functional only after OAuth creds are configured)
- `view="sign_in"` — Login form
- Custom theme matching the app's dark aesthetic
- Redirects to `/dashboard` on successful auth

#### [NEW] frontend/src/pages/RegisterPage.tsx

Same `<Auth>` component with `view="sign_up"`.

#### [NEW] frontend/src/pages/HomePage.tsx

Public landing page with:
- Hero section with studio name and CTA
- Brief feature highlights (Rooms, Equipment, Booking)
- Login/Register buttons
- *This is a shell — content will be enriched in Iteration 3*

#### [NEW] frontend/src/pages/DashboardPage.tsx

Authenticated user's home:
- Welcome message with user's name
- Role badge (User / Owner)
- Placeholder cards for future features (My Reservations, My Rentals, etc.)
- *Owner sees additional cards (Manage Rooms, Manage Items, etc.)*

#### [NEW] frontend/src/components/auth/ProtectedRoute.tsx

Route wrapper that:
- Checks if user is authenticated via `AuthContext`
- Shows loading skeleton while checking
- Redirects to `/login` if not authenticated

---

### Component 5: Database Migration (Supabase)

After creating the Supabase project, I'll run Django migrations which will create the `users_userprofile` table in the Supabase PostgreSQL database. Additionally, I'll apply the initial Studio Settings migration:

#### Django Migration: `users/0001_initial.py` (auto-generated)

Creates the `users_userprofile` table with all fields from the model above.

> [!NOTE]
> We do NOT use Supabase's `auth.users` table directly for the Django ORM. The `UserProfile` model is a separate table in the `public` schema that references the same UUID. This keeps Django's ORM clean and avoids conflicts with Supabase's internal auth tables.

---

### Routing Table

| Path | Page | Auth Required | Role |
|---|---|---|---|
| `/` | HomePage | No | — |
| `/login` | LoginPage | No | — |
| `/register` | RegisterPage | No | — |
| `/dashboard` | DashboardPage | Yes | Any |
| `*` | NotFoundPage | No | — |

---

## Auth Flow Diagram

```mermaid
sequenceDiagram
    participant U as User (Browser)
    participant FE as React App
    participant SB as Supabase Auth
    participant BE as Django API

    U->>FE: Click "Register" / "Login"
    FE->>SB: supabase.auth.signUp() / signInWithPassword()
    SB-->>FE: JWT (access_token + refresh_token)
    FE->>FE: Store session (Supabase SDK handles this)
    FE->>BE: POST /api/auth/sync/ (Bearer JWT)
    BE->>BE: Verify JWT, extract sub + email
    BE->>BE: Create/update UserProfile
    BE-->>FE: { id, email, full_name, role }
    FE->>FE: Update AuthContext → redirect to /dashboard
    
    Note over U,BE: Subsequent API calls
    U->>FE: Interact with app
    FE->>BE: GET /api/auth/me/ (Bearer JWT)
    BE->>BE: Verify JWT → lookup UserProfile
    BE-->>FE: User profile data
```

---

## Verification Plan

### Automated Tests

1. **Docker build & startup:**
   ```bash
   docker-compose build
   docker-compose up -d
   ```
   - ✅ Both containers start without errors
   - ✅ Frontend accessible at `http://localhost:5173`
   - ✅ Backend accessible at `http://localhost:8000/api/`

2. **Django health check:**
   ```bash
   docker-compose exec backend python manage.py check
   docker-compose exec backend python manage.py migrate --check
   ```
   - ✅ No system check errors
   - ✅ All migrations applied

3. **Backend API test (via browser or curl):**
   - `GET /api/auth/me/` without token → `401 Unauthorized` ✅
   - Register a user via the React frontend
   - `GET /api/auth/me/` with valid Bearer token → `200` with user profile ✅

### Manual Verification (You do this)

| # | Test | Expected Result |
|---|---|---|
| 1 | Run `docker-compose up` | Both services start, logs show no errors |
| 2 | Open `http://localhost:5173` | Landing page loads with navbar and hero |
| 3 | Click "Register" | Register page with email/password form + Google button |
| 4 | Register with email + password | Redirects to Dashboard, shows welcome message |
| 5 | Refresh page | Session persists, still on Dashboard |
| 6 | Click "Logout" | Returns to Home page, nav shows Login/Register |
| 7 | Click "Login" | Login page loads, sign in with same credentials |
| 8 | After login | Dashboard shows user name + "User" role badge |
| 9 | Set role to `owner` in DB | Dashboard shows "Owner" role badge + extra admin cards |
| 10 | Open `http://localhost:5173/dashboard` while logged out | Redirects to Login |

### Setting Owner Role (Manual DB step)

After registering, set the user's role to owner by running this SQL in the Supabase SQL Editor (Dashboard → SQL Editor):

```sql
UPDATE users_userprofile SET role = 'owner' WHERE email = 'your-email@example.com';
```

---

## Estimated Work Breakdown

| Component | Estimated Effort |
|---|---|
| Docker infrastructure + .env | ~15 min |
| Django project scaffold + settings | ~20 min |
| Users app (model, auth, views) | ~30 min |
| React frontend scaffold + routing | ~20 min |
| Auth UI (Login, Register, Context) | ~30 min |
| Layout shell (Navbar, Sidebar, Pages) | ~30 min |
| Supabase project creation + migration | ~15 min |
| Testing & debugging | ~20 min |
| **Total** | **~3 hours** |
