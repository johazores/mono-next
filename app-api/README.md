# app-api

Backend API server built with Next.js (Pages Router) + Prisma + MongoDB.

## Setup

```bash
cp .env.example .env
pnpm install
pnpm prisma:push
pnpm db:seed
pnpm dev
```

Runs on port **7001**.

## Environment Variables

| Variable               | Description                                    |
| ---------------------- | ---------------------------------------------- |
| `DATABASE_URL`         | MongoDB connection string                      |
| `ADMIN_SESSION_SECRET` | Admin session signing secret (min 32 chars)    |
| `USER_SESSION_SECRET`  | User session signing secret (min 32 chars)     |
| `NODE_ENV`             | `development` or `production`                  |
| `CLIENT_ORIGIN`        | Allowed CORS origin (default `localhost:7000`) |

## Structure

```
pages/api/         Route handlers (delegate to controllers)
controllers/       HTTP layer (auth, method routing, responses)
services/          Business logic and validation
repositories/      Data access (Prisma queries)
types/             Shared type definitions (barrel-exported via index.ts)
lib/               Utilities (auth, password, prisma, response, credentials, rate-limiter, activity-logger, csrf)
prisma/            Schema and seed scripts
tests/             Unit tests (Vitest) — mirrors source structure
```

## Database Collections

| Collection     | Purpose                                                         |
| -------------- | --------------------------------------------------------------- |
| `Admin`        | CMS admin accounts (name, email, password, role, lockout state) |
| `AdminSession` | Admin cookie-based auth sessions (hashed token, expiry)         |
| `User`         | Application users (name, email, password, lockout state)        |
| `UserSession`  | User cookie-based auth sessions (hashed token, expiry)          |
| `Plan`         | Subscription plans (name, slug, price, interval, features)      |
| `Subscription` | User subscription history (status, dates, plan relation)        |
| `ActivityLog`  | Centralized audit trail (actor, action, resource, IP, UA)       |

## Available Endpoints

### Admin Auth

| Method | Path              | Description             |
| ------ | ----------------- | ----------------------- |
| POST   | /api/panel/login  | Authenticate an admin   |
| POST   | /api/panel/logout | Clear the admin session |
| GET    | /api/panel/me     | Get current admin info  |

### Admin Profile (requires admin session)

| Method | Path               | Description             |
| ------ | ------------------ | ----------------------- |
| GET    | /api/panel/profile | Get own admin profile   |
| PUT    | /api/panel/profile | Update name or password |

### Admins (requires admin role)

| Method | Path            | Description     |
| ------ | --------------- | --------------- |
| GET    | /api/admins     | List all admins |
| POST   | /api/admins     | Create an admin |
| GET    | /api/admins/:id | Get an admin    |
| PUT    | /api/admins/:id | Update an admin |
| DELETE | /api/admins/:id | Delete an admin |

### User Auth

| Method | Path                     | Description            |
| ------ | ------------------------ | ---------------------- |
| POST   | /api/users/auth/register | Register a new user    |
| POST   | /api/users/auth/login    | Authenticate a user    |
| POST   | /api/users/auth/logout   | Clear the user session |
| GET    | /api/users/auth/me       | Get current user info  |

### User Profile (requires user session)

| Method | Path                    | Description                     |
| ------ | ----------------------- | ------------------------------- |
| GET    | /api/users/auth/profile | Get own user profile            |
| PUT    | /api/users/auth/profile | Update name, email, or password |

### Users (requires admin role)

| Method | Path           | Description    |
| ------ | -------------- | -------------- |
| GET    | /api/users     | List all users |
| POST   | /api/users     | Create a user  |
| GET    | /api/users/:id | Get a user     |
| PUT    | /api/users/:id | Update a user  |
| DELETE | /api/users/:id | Delete a user  |

### Plans

| Method | Path           | Auth  | Description              |
| ------ | -------------- | ----- | ------------------------ |
| GET    | /api/plans     | None  | List active plans        |
| POST   | /api/plans     | Admin | Create a plan            |
| GET    | /api/plans/:id | None  | Get a plan               |
| PUT    | /api/plans/:id | Admin | Update a plan            |
| DELETE | /api/plans/:id | Admin | Soft-delete (deactivate) |

### Subscriptions (requires admin role)

| Method | Path                         | Description                       |
| ------ | ---------------------------- | --------------------------------- |
| GET    | /api/users/:id/subscriptions | List user subscription history    |
| POST   | /api/users/:id/subscriptions | Assign a plan to a user           |
| DELETE | /api/users/:id/subscriptions | Cancel user's active subscription |

### Own Subscription (requires user session)

| Method | Path                         | Description                           |
| ------ | ---------------------------- | ------------------------------------- |
| GET    | /api/users/auth/subscription | Get own active subscription & history |

### Activity Logs (requires admin role)

| Method | Path               | Description                                |
| ------ | ------------------ | ------------------------------------------ |
| GET    | /api/activity-logs | List activity logs (paginated, filterable) |

Query parameters: `page`, `limit` (max 100), `action`, `actor`, `actorId`, `resource`, `from`, `to`.

## Testing

Unit tests use [Vitest](https://vitest.dev/) and run automatically before every build via the `prebuild` script.

```bash
pnpm test          # single run
pnpm test:watch    # watch mode
pnpm build         # runs tests first, then builds
```

### Test Structure

```
tests/
  lib/               Pure utility tests (no mocks)
    password.test.ts
    rate-limiter.test.ts
  services/           Business logic tests (mocked repositories)
    admin-service.test.ts
    user-service.test.ts
    activity-log-service.test.ts
```

### Guidelines

- **Every new feature must include tests.** PRs without tests for new logic will be rejected.
- Test files live in `tests/` mirroring the source structure.
- Use `vi.mock()` to mock repository modules in service tests — never hit the database.
- Focus on core logic and critical flows: validation, auth, guards, error paths.
- Use unique identifiers per test to avoid shared state.
- Run `pnpm test` locally before pushing.

### Available Scripts

| Script            | Description                                     |
| ----------------- | ----------------------------------------------- |
| `pnpm test`       | Run all tests once                              |
| `pnpm test:watch` | Run tests in watch mode during development      |
| `pnpm build`      | Run tests (prebuild) then build the application |

## Authentication

Two separate cookie-based session systems run independently:

### Admin Auth (`admin_session` cookie)

Uses HMAC-SHA256 hashed tokens stored in `AdminSession`. Sessions use
`HttpOnly`, `SameSite=Lax` cookies with a 7-day expiry. Protected by
`ADMIN_SESSION_SECRET` (minimum 32 characters). Middleware: `requireAdmin()`.

### User Auth (`user_session` cookie)

Uses HMAC-SHA256 hashed tokens stored in `UserSession`. Sessions use
`HttpOnly`, `SameSite=Lax` cookies with a 14-day expiry. Protected by
`USER_SESSION_SECRET` (minimum 32 characters). Middleware: `requireUser()`.
Users register with a `free` plan by default and can be upgraded via the
admin panel.

### CSRF Protection

All state-changing requests (POST, PUT, DELETE) are validated against the
`Origin` or `Referer` header to ensure requests originate from the expected
client (`CLIENT_ORIGIN`). In development mode, requests without an origin
header (e.g. curl, Postman) are permitted.

### Password Policy

Passwords must be at least 8 characters and include an uppercase letter,
a lowercase letter, and a digit. Timing-safe comparison is used for all
password checks, including a dummy hash when the account doesn't exist.

### Security Headers

All responses include: `X-Frame-Options: DENY`,
`X-Content-Type-Options: nosniff`,
`Referrer-Policy: strict-origin-when-cross-origin`,
and a restrictive `Permissions-Policy`.

## Rate Limiting

In-memory sliding window rate limiter keyed by client IP + action.

| Action      | Max Attempts | Window |
| ----------- | ------------ | ------ |
| Admin login | 5            | 15 min |
| User login  | 10           | 15 min |

Returns `429 Too Many Requests` with a `Retry-After` header when exceeded.
Stale entries are automatically cleaned every 5 minutes.

## Activity Logging

A centralized audit trail records all significant actions. Logging is
fire-and-forget (never breaks the main request flow).

### Tracked Actions

| Action                | Trigger                                  |
| --------------------- | ---------------------------------------- |
| `admin.login`         | Successful admin login                   |
| `admin.login_failed`  | Failed admin login attempt               |
| `admin.logout`        | Admin logout                             |
| `admin.create`        | Admin account created via panel          |
| `admin.update`        | Admin account updated via panel          |
| `admin.delete`        | Admin account deleted via panel          |
| `user.login`          | Successful user login                    |
| `user.login_failed`   | Failed user login attempt                |
| `user.register`       | New user registration                    |
| `user.logout`         | User logout                              |
| `user.create`         | User created by admin                    |
| `user.update`         | User updated by admin                    |
| `user.delete`         | User deleted by admin                    |
| `profile.update`      | Profile self-update (admin or user)      |
| `admin.locked`        | Admin account locked (too many attempts) |
| `user.locked`         | User account locked (too many attempts)  |
| `plan.create`         | Plan created                             |
| `plan.update`         | Plan updated                             |
| `plan.delete`         | Plan deactivated                         |
| `subscription.assign` | Subscription assigned to a user          |
| `subscription.cancel` | Subscription cancelled                   |

Each log entry records: actor type, actor ID/email, action, resource,
resource ID, optional metadata, client IP, user agent, HTTP method,
request path, and timestamp.

## Profile Management

### Admin Profile (`PUT /api/panel/profile`)

- Update display name
- Change password (requires `currentPassword` + `newPassword`)
- Email and role cannot be self-modified

### User Profile (`PUT /api/users/auth/profile`)

- Update display name
- Change email (uniqueness check)
- Change password (requires `currentPassword` + `newPassword`)

## Subscription Plans

Plans are stored in the `Plan` collection and managed dynamically via the
admin panel or API. The seed script creates four default plans:

| Slug         | Price | Interval | Description                  |
| ------------ | ----- | -------- | ---------------------------- |
| `free`       | $0    | month    | Default plan on registration |
| `starter`    | $9    | month    | Basic paid tier              |
| `pro`        | $29   | month    | Professional tier            |
| `enterprise` | $99   | month    | Full-featured tier           |

Each plan has a `features` array (string list), `isActive` flag, and
`sortOrder` for display ordering.

### Subscription Model

Subscriptions link users to plans and track history:

- `status` — `active`, `cancelled`, `expired`, or `past_due`
- `startDate` / `endDate` — Subscription period
- `externalId` — Optional external payment provider reference
- `metadata` — Optional JSON for provider-specific data

When a user is assigned a new plan, any existing active subscription is
automatically cancelled. Users always have at most one active subscription.

## Default Seed

Admin:

```
Email:    admin@admin.com
Password: ChangeMe123!
Role:     admin
```

User:

```
Email:    user@demo.com
Password: ChangeMe123!
Plan:     starter (assigned via subscription)
```
