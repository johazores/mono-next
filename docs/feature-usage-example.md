# Feature Validation & Usage Guide

This document explains how the feature-gating system works and provides example code for validating features on both the server and client side.

---

## How Feature-Gating Works

The feature system has three layers:

1. **Feature Registry** — A database of all available features (e.g. `storage.5gb`, `api.access`).
2. **Products** — Each product defines which feature keys it grants via `accessKeys`.
3. **Memberships** — When a user purchases a product, they get a membership that stores the granted `featureKeys`.

When checking if a user has access to a feature, the system:

1. Looks up the user's active memberships.
2. Checks if any membership's `featureKeys` array includes the requested feature key.
3. For sub-users, also checks the parent account's memberships (inherited access).

---

## Server-Side: Checking Feature Access

### Using `featureService.checkAccess()`

```typescript
// In any API controller or service
import { featureService } from "@/services/feature-service";

export async function someProtectedController(req, res) {
  const session = await requireUser(req, res);
  if (!session) return;

  // Check if the user has a specific feature
  const access = await featureService.checkAccess(
    session.user.id,
    "api.access",
  );

  if (!access.enabled) {
    return sendError(res, "This feature requires a premium plan.", 403);
  }

  // User has access, proceed with the action
  // access.source is "direct" or "inherited" (from parent account)
  return sendOk(res, { message: "You have API access!" });
}
```

### Using `featureService.getEnabledFeatures()`

```typescript
// Get all features enabled for a user
import { featureService } from "@/services/feature-service";

const enabledFeatures = await featureService.getEnabledFeatures(userId);
// Returns: FeatureDefinition[] — array of { key, description, category }
```

### Using the Feature Registry directly

```typescript
import { isFeatureEnabled, getAllFeatures } from "@/lib/feature-registry";

// Check against a known list of plan features
const planFeatures = ["storage.5gb", "support.email", "api.access"];
const hasApiAccess = isFeatureEnabled(planFeatures, "api.access"); // true

// Get all registered features (cached, 1-minute TTL)
const allFeatures = await getAllFeatures();
```

---

## Client-Side: Checking Feature Access

### API Endpoint

```
GET /api/users/auth/features
```

Returns the authenticated user's enabled features:

```json
{
  "ok": true,
  "data": {
    "features": [
      {
        "key": "storage.5gb",
        "description": "5GB Storage",
        "category": "storage"
      },
      {
        "key": "api.access",
        "description": "API Access",
        "category": "features"
      }
    ]
  }
}
```

### React Hook: `useFeatures()`

Create a hook to fetch and cache the user's features:

```typescript
// hooks/use-features.ts
"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/swr";
import type { FeatureDefinition } from "@/types";

type FeaturesResponse = { features: FeatureDefinition[] };

export function useFeatures() {
  const { data, error, isLoading } = useSWR<FeaturesResponse>(
    "/api/users/auth/features",
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  const features = data?.features ?? [];
  const featureKeys = new Set(features.map((f) => f.key));

  return {
    features,
    isLoading,
    error,
    /** Check if a specific feature key is enabled for the current user. */
    hasFeature: (key: string) => featureKeys.has(key),
  };
}
```

### Conditional UI Rendering

```tsx
// In a component
import { useFeatures } from "@/hooks/use-features";

export function DashboardPage() {
  const { hasFeature, isLoading } = useFeatures();

  if (isLoading) return <p>Loading...</p>;

  return (
    <div>
      <h1>Dashboard</h1>

      {/* Only show the API section if the user has api.access */}
      {hasFeature("api.access") && (
        <section>
          <h2>API Keys</h2>
          <p>Manage your API keys here.</p>
        </section>
      )}

      {/* Show upgrade prompt if user doesn't have a feature */}
      {!hasFeature("reports.advanced") && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p>Advanced reports are available on the Pro plan.</p>
          <a href="/pricing">Upgrade now</a>
        </div>
      )}

      {/* Conditionally enable a button */}
      <button
        disabled={!hasFeature("integrations.custom")}
        onClick={() => {
          /* open integrations panel */
        }}
      >
        Custom Integrations
        {!hasFeature("integrations.custom") && " (Pro)"}
      </button>
    </div>
  );
}
```

### Route Protection Pattern

Protect entire pages based on features:

```tsx
// app/(user)/api-keys/page.tsx
"use client";

import { useFeatures } from "@/hooks/use-features";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ApiKeysPage() {
  const { hasFeature, isLoading } = useFeatures();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !hasFeature("api.access")) {
      router.replace("/my-account?upgrade=api.access");
    }
  }, [isLoading, hasFeature, router]);

  if (isLoading || !hasFeature("api.access")) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>API Keys</h1>
      {/* Protected content */}
    </div>
  );
}
```

---

## Feature Categories

Features are organized by category for display purposes:

| Category   | Examples                                                              |
| ---------- | --------------------------------------------------------------------- |
| `storage`  | storage.1gb, storage.5gb, storage.50gb, storage.unlimited             |
| `support`  | support.community, support.email, support.priority, support.dedicated |
| `features` | api.access, sub-users.create, reports.advanced, integrations.custom   |

Categories are dynamic — when you create a feature in the admin panel, you can type any category name or pick from existing ones via the suggestions dropdown.

---

## Admin: Managing Features

1. Go to **Admin → Features** in the sidebar.
2. **Add New** to create a feature:
   - **Key**: Unique identifier (e.g. `storage.10gb`). Lowercase with dots/hyphens.
   - **Description**: Human-readable description shown to users.
   - **Category**: Group for display purposes (type to create new or pick existing).
   - **Active**: Whether this feature is available.
3. Features are assigned to products via the **Products** editor's "Access Keys" checkboxes.
4. When a user purchases a product, they receive all the product's access keys as enabled features.
