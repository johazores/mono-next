# mono-next

A monorepo project with Next.js applications.

## Project Structure

```
mono-next/
├── app-api/              # Next.js API application
│   ├── app/
│   ├── public/
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
├── app-client/           # Next.js client application
│   ├── app/
│   ├── public/
│   ├── next.config.ts
│   ├── package.json
│   └── tsconfig.json
└── package.json          # Root package.json
```

## Applications

### app-api

Next.js application serving as the API backend.

### app-client

Next.js application serving the client frontend.

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Run development servers:
   ```bash
   pnpm dev
   ```

## Development

Each application can be developed and deployed independently. Both use:

- **Framework**: Next.js
- **Language**: TypeScript
- **Package Manager**: pnpm
