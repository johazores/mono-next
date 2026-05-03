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
| `ADMIN_SESSION_SECRET` | Session signing secret (min 32 characters)     |
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

| Collection     | Purpose                                              |
| -------------- | ---------------------------------------------------- |
| `Admin`        | CMS admin accounts (name, email, password, role)     |
| `AdminSession` | Cookie-based auth sessions (hashed token, expiry)    |
| `User`         | Application users (reserved for future app features) |

## Available Endpoints

### Auth

| Method | Path             | Description              |
| ------ | ---------------- | ------------------------ |
| POST   | /api/auth/login  | Authenticate an admin    |
| POST   | /api/auth/logout | Clear the session cookie |
| GET    | /api/auth/me     | Get current admin info   |

### Admins (requires admin role)

| Method | Path            | Description     |
| ------ | --------------- | --------------- |
| GET    | /api/admins     | List all admins |
| POST   | /api/admins     | Create an admin |
| GET    | /api/admins/:id | Get an admin    |
| PUT    | /api/admins/:id | Update an admin |
| DELETE | /api/admins/:id | Delete an admin |

## Authentication

Cookie-based sessions using HMAC-SHA256 hashed tokens stored in the
`AdminSession` collection. Sessions use `HttpOnly`, `SameSite=Lax` cookies
with a 7-day expiry. The `ADMIN_SESSION_SECRET` environment variable is
required (minimum 32 characters).

## Default Seed

```
Email:    admin@admin.com
Password: ChangeMe123!
Role:     admin
```
