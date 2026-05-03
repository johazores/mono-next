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
lib/               Utilities (auth, password, prisma, response, credentials)
prisma/            Schema and seed scripts
```

## Database Collections

| Collection     | Purpose                                                       |
| -------------- | ------------------------------------------------------------- |
| `Admin`        | CMS admin accounts (name, email, password, role)              |
| `AdminSession` | Admin cookie-based auth sessions (hashed token, expiry)       |
| `User`         | Application users (name, email, password, plan, subscription) |
| `UserSession`  | User cookie-based auth sessions (hashed token, expiry)        |
| `ActivityLog`  | Centralized action audit trail (actor, action, resource, IP)  |

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

### Activity Logs (requires admin role)

| Method | Path               | Description                                |
| ------ | ------------------ | ------------------------------------------ |
| GET    | /api/activity-logs | List activity logs (paginated, filterable) |

Query parameters: `page`, `limit` (max 100), `action`, `actor`, `actorId`, `resource`.

## Authentication

Two separate cookie-based session systems run independently:

### Admin Auth (`admin_session` cookie)

Uses HMAC-SHA256 hashed tokens stored in `AdminSession`. Sessions use
`HttpOnly`, `SameSite=Lax` cookies with a 7-day expiry. Protected by
`ADMIN_SESSION_SECRET` (minimum 32 characters). Middleware: `requireAdmin()`.

### User Auth (`user_session` cookie)

Uses HMAC-SHA256 hashed tokens stored in `UserSession`. Sessions use
`HttpOnly`, `SameSite=Lax` cookies with a 30-day expiry. Protected by
`USER_SESSION_SECRET` (minimum 32 characters). Middleware: `requireUser()`.
Users register with a `free` plan by default and can be upgraded via the
admin panel.

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

| Action               | Trigger                             |
| -------------------- | ----------------------------------- |
| `admin.login`        | Successful admin login              |
| `admin.login_failed` | Failed admin login attempt          |
| `admin.logout`       | Admin logout                        |
| `admin.create`       | Admin account created via panel     |
| `admin.update`       | Admin account updated via panel     |
| `admin.delete`       | Admin account deleted via panel     |
| `user.login`         | Successful user login               |
| `user.login_failed`  | Failed user login attempt           |
| `user.register`      | New user registration               |
| `user.logout`        | User logout                         |
| `user.create`        | User created by admin               |
| `user.update`        | User updated by admin               |
| `user.delete`        | User deleted by admin               |
| `profile.update`     | Profile self-update (admin or user) |

Each log entry records: actor type, actor ID/email, action, resource,
resource ID, optional metadata, client IP, and timestamp.

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

| Plan         | Description                  |
| ------------ | ---------------------------- |
| `free`       | Default plan on registration |
| `starter`    | Basic paid tier              |
| `pro`        | Professional tier            |
| `enterprise` | Full-featured tier           |

Subscription fields on the User model:

- `plan` — Current subscription plan
- `subscriptionId` — External payment provider reference
- `subscriptionEnds` — Expiry date of the current subscription

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
Plan:     starter
```
