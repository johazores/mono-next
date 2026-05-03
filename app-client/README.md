# app-client

Admin panel frontend built with Next.js (App Router) + Tailwind CSS.

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
  (admin)/         Protected admin pages (dashboard, admins)
  (public)/        Public pages (login)
components/
  admin/           ResourceManager, ResourceEditor, ResourceList, FieldRenderer
  layout/          AdminShell (sidebar navigation, auth info, logout)
  ui/              Button, Modal, Notice, StatusBadge
hooks/             useAdminResource (polling data hook)
services/          API client, auth service, resource service
types/             ApiResult, ResourceField, ResourceItem
```

## Authentication

The admin layout (`(admin)/layout.tsx`) checks authentication on mount by
calling `/api/auth/me`. Unauthenticated visitors are redirected to `/login`.
All API requests include `credentials: "include"` for cookie passthrough.

## Pages

| Path      | Description                          |
| --------- | ------------------------------------ |
| `/`       | Dashboard (protected)                |
| `/admins` | Admin account management (protected) |
| `/login`  | Login form (public)                  |
