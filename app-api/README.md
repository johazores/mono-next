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

## Available Endpoints

### Admin Auth

| Method | Path             | Description             |
| ------ | ---------------- | ----------------------- |
| POST   | /api/auth/login  | Authenticate an admin   |
| POST   | /api/auth/logout | Clear the admin session |
| GET    | /api/auth/me     | Get current admin info  |

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

### Users (requires admin role)

| Method | Path           | Description    |
| ------ | -------------- | -------------- |
| GET    | /api/users     | List all users |
| POST   | /api/users     | Create a user  |
| GET    | /api/users/:id | Get a user     |
| PUT    | /api/users/:id | Update a user  |
| DELETE | /api/users/:id | Delete a user  |

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
