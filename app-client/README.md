# app-client

Frontend application built with Next.js (App Router) + Tailwind CSS.
Includes an admin panel and a user-facing dashboard.

## Setup

```bash
pnpm install
pnpm dev
```

Runs on port **7000**. Requires `app-api` running on port 7001.

## Environment

Create `.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:7001
```

## Structure

```
app/
  (admin)/         Protected admin pages (dashboard, users, admins)
  (user)/          Protected user pages (dashboard, account)
  (public)/        Public pages (login, user-login, user-register)
components/
  admin/           ResourceManager, ResourceEditor, ResourceList, FieldRenderer
  layout/          AdminShell, UserShell (sidebar navigation, auth info, logout)
  ui/              Button, Modal, Notice, StatusBadge
hooks/             useAdminResource (polling data hook)
services/          API client, auth service, user auth service, resource service
types/             ApiResult, ResourceField, ResourceItem
```

## Authentication

Two separate auth guards protect different route groups:

- **Admin** (`(admin)/layout.tsx`): Checks `/api/auth/me`. Redirects to `/login`.
- **User** (`(user)/layout.tsx`): Checks `/api/users/auth/me`. Redirects to `/user-login`.

All API requests include `credentials: "include"` for cookie passthrough.

## Pages

### Admin Panel

| Path      | Description                          |
| --------- | ------------------------------------ |
| `/`       | Admin dashboard (protected)          |
| `/users`  | User management (protected)          |
| `/admins` | Admin account management (protected) |
| `/login`  | Admin login form (public)            |

### User Dashboard

| Path             | Description                        |
| ---------------- | ---------------------------------- |
| `/dashboard`     | User dashboard (protected)         |
| `/account`       | User account and subscription info |
| `/user-login`    | User login form (public)           |
| `/user-register` | User registration form (public)    |
