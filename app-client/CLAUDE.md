@AGENTS.md

## Coding Rules

- **All types in `types/`**: Every `type`, `interface`, and `enum` must be defined in `app-client/types/` and re-exported from `types/index.ts`. Never define types inline in services, components, hooks, or pages. Import from `@/types`.
- **No direct `api-client` imports in pages/components**: All API calls go through domain-specific service files (e.g. `sub-user-service.ts`, `purchase-service.ts`). Pages import from services, services import from `api-client`.
- **Barrel exports**: Use `@/types`, `@/components/ui`, `@/components/admin` for clean single-path imports.
