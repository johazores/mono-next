# mono-next

A monorepo with two Next.js applications: an API backend and an admin panel frontend.

## Project Structure

```
mono-next/
├── app-api/              # Backend API (Pages Router, port 7001)
│   ├── controllers/      # HTTP controllers
│   ├── services/         # Business logic
│   ├── repositories/     # Data access (Prisma)
│   ├── lib/              # Utilities (auth, password, prisma)
│   ├── types/            # Shared TypeScript types
│   ├── pages/api/        # API route handlers
│   └── prisma/           # Schema and seed scripts
├── app-client/           # Admin panel (App Router, port 7000)
│   ├── app/              # Pages (admin + public route groups)
│   ├── components/       # UI, layout, admin components
│   ├── services/         # API client, auth, resource services
│   ├── hooks/            # Custom React hooks
│   └── types/            # Shared TypeScript types
├── docs/                 # Architecture documentation
└── package.json          # Root scripts (dev, build, format)
```

## Applications

### app-api

Backend API server with cookie-based admin authentication, admin CRUD,
and a layered architecture (controller, service, repository).

### app-client

Admin panel with login, dashboard, and admin account management.
Auth-guarded routes redirect to login when unauthenticated.

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up the API environment:

   ```bash
   cd app-api && cp .env.example .env
   ```

3. Push the database schema and seed:

   ```bash
   cd app-api
   pnpm prisma:push
   pnpm db:seed
   ```

4. Run development servers:

   ```bash
   pnpm dev
   ```

## Tech Stack

- **Framework**: Next.js (v16)
- **Language**: TypeScript
- **Database**: MongoDB (via Prisma)
- **Styling**: Tailwind CSS (client only)
- **Package Manager**: pnpm
