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

## Structure

```
pages/api/       → Route handlers (delegate to controllers)
server/
  controllers/   → HTTP layer (auth, method routing, responses)
  services/      → Business logic and validation
  repositories/  → Data access (Prisma queries)
  types/         → Shared type definitions
lib/             → Utilities (auth, password, prisma, response)
prisma/          → Schema and seed scripts
```

## Available Endpoints

| Method | Path           | Description    |
| ------ | -------------- | -------------- |
| GET    | /api/users     | List all users |
| POST   | /api/users     | Create a user  |
| GET    | /api/users/:id | Get a user     |
| PUT    | /api/users/:id | Update a user  |
| DELETE | /api/users/:id | Delete a user  |
