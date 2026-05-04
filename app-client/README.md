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
  page.tsx           Public landing page with navigation links
  (admin)/admin/     Protected admin pages (dashboard, users, admins, products, features, reports, activity, settings, profile)
  (user)/            Protected user pages (my-account, account, features, sub-users, purchases)
  (public)/          Public pages (login, user-login, user-register)
components/
  admin/           ResourceManager, ResourceEditor, ResourceList, FieldRenderer
  auth/            AuthConfigProvider, ClerkSignIn, ClerkSignUp
  layout/          AdminShell, UserShell (sidebar navigation, auth info, logout)
  ui/              Button, Modal, Notice, StatusBadge
hooks/             useAdminAuth, useUserAuth (SWR-cached auth), useAdminResource (SWR-polled data), useFeatures, useCart
lib/               SWR fetchers (swrFetcher, swrListFetcher, swrFeatureFetcher)
services/          API client, auth service, user auth service, resource service, sub-user service, purchase service, report service, activity log service, admin setting service
types/             ApiResult, ResourceField, ResourceItem, AuthProvider, PublicAuthConfig
```

## Authentication

Two separate auth guards protect different route groups:

- **Admin** (`(admin)/layout.tsx`): Uses `useAdminAuth()` hook (SWR-cached `/api/panel/me` with 30s dedup). Redirects to `/login`.
- **User** (`(user)/layout.tsx`): Uses `useUserAuth()` hook (SWR-cached `/api/users/auth/me` with 30s dedup). Redirects to `/user-login`.

User authentication supports dual providers (credentials or Clerk) based on
the `SiteSetting` configuration. The `AuthConfigProvider` context fetches the
auth config on load and lazily initializes Clerk when configured. When Clerk is
active, Bearer tokens are automatically attached to all API requests.

All API requests include `credentials: "include"` for cookie passthrough.

## Pages

### Admin Panel

| Path              | Description                                   |
| ----------------- | --------------------------------------------- |
| `/admin`          | Admin dashboard (protected)                   |
| `/admin/users`    | User management (protected)                   |
| `/admin/admins`   | Admin account management (protected)          |
| `/admin/products` | Product management (protected)                |
| `/admin/features` | Feature flag management (protected)           |
| `/admin/reports`  | Reports dashboard (protected)                 |
| `/admin/activity` | Activity log viewer (protected)               |
| `/admin/settings` | Auth provider and system settings (protected) |
| `/admin/profile`  | Admin profile management (protected)          |
| `/login`          | Admin login form (public)                     |

### User Dashboard

| Path             | Description                                |
| ---------------- | ------------------------------------------ |
| `/my-account`    | User dashboard (protected)                 |
| `/account`       | Profile edit, password change, active plan |
| `/features`      | View enabled features by source            |
| `/sub-users`     | Manage sub-users (requires feature)        |
| `/purchases`     | Purchase history and product store         |
| `/user-login`    | User login form (public)                   |
| `/user-register` | User registration form (public)            |
