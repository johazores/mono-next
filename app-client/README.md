# app-client

Frontend application built with Next.js (App Router) + Tailwind CSS.

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
app/             → Pages (App Router)
components/
  admin/         → ResourceManager, AdminModal
hooks/           → useAdminResource
services/        → API client, resource service
```
