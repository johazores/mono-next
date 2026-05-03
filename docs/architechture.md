# Architecture

## Overview

Monorepo with two independent Next.js applications sharing a common architecture philosophy:

- **`app-api`** — Backend API server (port 7001)
- **`app-client`** — Frontend with admin panel, user dashboard, and public landing (port 7000)

Both apps are managed from the root with `pnpm` and `concurrently`.

---

## Request Flow

```
Client UI -> api-client.ts -> fetch() -> /api/[resource]
                                              |
                                       Controller (HTTP layer)
                                              |
                                       Service (business logic)
                                              |
                                       Repository (data access)
                                              |
                                       Prisma -> MongoDB
```

---

## Backend (`app-api`)

### Layered Architecture

```
app-api/
├── pages/api/         <- Thin route files (1-3 lines, delegates to controller)
├── controllers/       <- HTTP method routing, auth gating, response formatting
├── services/          <- Business logic, validation, data transformation
├── repositories/      <- Pure data access (Prisma queries only)
├── types/             <- Shared type definitions (barrel-exported via index.ts)
│   ├── auth.ts        <- Role, AccountStatus, AuthUser, AuthSession (admin auth)
│   ├── admin.ts       <- AdminRecord, CreateAdminInput, UpdateAdminInput, UpdateAdminProfileInput
│   ├── user.ts        <- UserRecord, UserAuthSession, SubscriptionPlan, UpdateUserProfileInput
│   ├── activity-log.ts <- ActivityAction, ActivityActor, ActivityLogRecord, ActivityLogFilter
│   └── response.ts    <- ApiResponse<T>, ListResponse<T>
├── lib/               <- Cross-cutting utilities (auth, password, prisma, response, credentials, rate-limiter, activity-logger)
└── prisma/            <- Schema + seed scripts
```

### Layer Responsibilities

| Layer                    | Does                                                                    | Does NOT                               |
| ------------------------ | ----------------------------------------------------------------------- | -------------------------------------- |
| **Route** (`pages/api/`) | Exports controller as default                                           | Contain logic                          |
| **Controller**           | Checks auth, routes by HTTP method, calls service, formats response     | Validate business rules, touch DB      |
| **Service**              | Validates input, enforces business rules, orchestrates repository calls | Know about HTTP, touch Prisma directly |
| **Repository**           | Executes Prisma queries, defines `select` projections                   | Contain logic, throw business errors   |

### Key Patterns

- **Uniform response envelope**: All responses use `{ ok: true, data }` or `{ ok: false, error }`
- **Singleton pattern**: Repository/service objects exported as plain object literals (not classes)
- **Password security**: PBKDF2 with 120k iterations, SHA-512, 64-byte key, timing-safe comparison
- **Auth guard**: `requireAdmin()` for admin routes, `requireUser()` for user routes
- **Rate limiting**: In-memory sliding window limiter per IP (admin login: 5/15min, user login: 10/15min)
- **Activity logging**: Fire-and-forget audit trail via `logActivity()` — never breaks main request
- **Dual cookie-based sessions**: Separate `admin_session` (7d) and `user_session` (30d) cookies
- **Secure admin URLs**: Admin auth endpoints served from `/api/panel/*` (non-predictable path)
- **Subscription model**: Users have plan (free/starter/pro/enterprise), subscriptionId, subscriptionEnds
- **Prisma singleton**: `globalThis` caching prevents connection leaks during hot reload

### Database

- **Provider**: MongoDB (via Prisma)
- **IDs**: Auto-generated ObjectId mapped to `_id`
- **Collections**:
  - `Admin` — CMS admin accounts (name, email, passwordHash, role, status)
  - `AdminSession` — Admin auth sessions (adminId, tokenHash, expiresAt)
  - `User` — Application users (name, email, passwordHash, plan, subscription)
  - `UserSession` — User auth sessions (userId, tokenHash, expiresAt)
  - `ActivityLog` — Audit trail (actor, actorId, actorEmail, action, resource, resourceId, metadata, ip)
- **Schema location**: `app-api/prisma/schema.prisma`

---

## Frontend (`app-client`)

### Structure

```
app-client/
├── app/               ← Next.js App Router pages
│   ├── page.tsx       <- Public landing page with navigation links
│   ├── (admin)/       <- Protected admin pages (auth guard in layout)
│   │   ├── layout.tsx <- Auth check, redirects to /login if unauthenticated
│   │   └── admin/     <- All admin pages under /admin/* prefix
│   │       ├── page.tsx   <- Dashboard (/admin)
│   │       ├── admins/    <- Admin account management (/admin/admins)
│   │       ├── users/     <- User management (/admin/users)
│   │       ├── activity/  <- Activity log viewer (/admin/activity)
│   │       └── profile/   <- Admin profile management (/admin/profile)
│   ├── (user)/        <- Protected user pages (auth guard in layout)
│   │   ├── layout.tsx <- Auth check, redirects to /user-login
│   │   ├── dashboard/ <- User dashboard
│   │   └── account/   <- Profile edit, password change, subscription info
│   └── (public)/      <- Public pages
│       ├── layout.tsx <- Minimal layout
│       ├── login/     <- Admin login form
│       ├── user-login/ <- User login form
│       └── user-register/ <- User registration form
├── components/
│   ├── ui/            <- Reusable primitives (Button, Modal, Notice, StatusBadge)
│   ├── layout/        <- App shells (AdminShell with sidebar nav + logout)
│   └── admin/         <- Resource CRUD components (ResourceManager, ResourceEditor, ResourceList, FieldRenderer)
├── hooks/             <- Custom React hooks (useAdminResource)
├── services/          <- API client layer (api-client, auth-service, user-auth-service, resource-service, activity-log-service)
└── types/             <- Shared type definitions (barrel-exported via index.ts)
    ├── api.ts         <- ApiResult<T>, ApiRequestOptions, ResourceListResult<T>
    └── resource.ts    <- ResourceField, ResourceItem, FieldType, EditorSection
```

### Key Patterns

- **Tailwind-only styling**: No custom CSS. All styling via Tailwind utility classes co-located in JSX
- **UI primitives**: Reusable `Button`, `Modal`, `Notice`, `StatusBadge` components in `components/ui/`
- **Admin layout shell**: `AdminShell` provides sidebar navigation wrapping admin pages
- **User layout shell**: `UserShell` provides sidebar navigation with plan badge wrapping user pages
- **Decomposed CRUD**: `ResourceManager` orchestrates `ResourceEditor` (modal form) and `ResourceList` (item cards)
- **Generic CRUD client**: `resourceService.list/create/update/remove/save` works for any endpoint
- **Auto-refresh hook**: `useAdminResource<T>` polls every 15s for fresh data
- **Field-driven forms**: `FieldRenderer` generates form inputs from field config arrays
- **Barrel exports**: `@/types`, `@/components/ui`, `@/components/admin` — clean single-path imports

### Service Layer

```
UI Component
    | calls
resourceService.list("/api/admins")
    | calls
apiGet("/api/admins")
    | calls
fetch(`${NEXT_PUBLIC_API_URL}/api/admins`, { credentials: "include" })
    | parses
{ ok: true, data: { items: [...] } }
```

---

## Scripts

| Command           | Description                |
| ----------------- | -------------------------- |
| `pnpm dev`        | Run both apps concurrently |
| `pnpm dev:client` | Frontend only (port 7000)  |
| `pnpm dev:server` | API only (port 7001)       |
| `pnpm build`      | Build both apps            |
| `pnpm format`     | Prettier format all source |

### API-specific

| Command            | Description                      |
| ------------------ | -------------------------------- |
| `pnpm prisma:push` | Push schema to MongoDB           |
| `pnpm db:seed`     | Seed default admin and demo user |
| `pnpm setup`       | Full install + push + seed       |

---

## Environment Variables

### `app-api/.env`

```
DATABASE_URL=mongodb://localhost:27017/mono-next
```

### `app-client/.env.local`

```
NEXT_PUBLIC_API_URL=http://localhost:7001
```

---

## Design Decisions

1. **Separate apps over monolithic Next.js** — Frontend and backend scale independently. Deploy to different infra if needed.
2. **Pages Router for API routes** — Stable, well-supported pattern for route-per-file API endpoints in Next.js.
3. **Plain objects over classes** — Services/repositories are simple object literals. No inheritance, no DI framework, easy to test with mocks.
4. **Auth middleware with stable contract** — Controllers call `requireAdmin()`. The implementation in `lib/admin-auth.ts` handles token validation and role checking. Swap strategies without touching controllers.
5. **MongoDB via Prisma** — Prisma abstracts the query layer. Swapping to PostgreSQL requires only changing `provider` in schema and ID strategy.
6. **Tailwind over CSS modules** — Styles live where they're used. No class name collisions. No dead CSS.
7. **Field-config driven UI** — `ResourceManager` renders any CRUD interface from a field array. Adding a new resource page = defining fields + `emptyItem`.

---

## Adding a New Resource (Checklist)

### Backend

1. Add model to `prisma/schema.prisma`
2. Create `repositories/{resource}-repository.ts`
3. Create `services/{resource}-service.ts`
4. Create `controllers/{resource}-controller.ts`
5. Add types to `types/{resource}.ts` and re-export from `types/index.ts`
6. Create `pages/api/{resource}/index.ts` → export collection controller
7. Create `pages/api/{resource}/[id].ts` → export item controller

### Frontend

1. Create `app/{resource}/page.tsx` with field definitions + `ResourceManager`
2. (Optional) Add resource-specific types to `types/` if needed

---

## Security

- Passwords hashed with PBKDF2 (120k iterations, SHA-512)
- `passwordHash` never returned to clients (`select` projections in repository, `safeUser()` in service)
- Timing-safe comparison for password verification
- Auth middleware on all mutating endpoints (token validation + role gating)
- Input validation at service layer (role allowlist, email normalization, required fields)
- Admin guard: Cannot delete/demote the last active admin user
