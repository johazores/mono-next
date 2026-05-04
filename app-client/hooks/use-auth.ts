"use client";

import useSWR from "swr";
import { swrFetcher } from "@/lib/swr";
import type { AuthUser, AppUser } from "@/types";

/**
 * Cached admin auth check. Deduplicates across components — navigating
 * between admin pages reuses the cached result instead of re-fetching.
 */
export function useAdminAuth() {
  const { data, error, isLoading } = useSWR<AuthUser>(
    "/api/panel/me",
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  );
  return { admin: data ?? null, error, isLoading };
}

/**
 * Cached user auth check. Same deduplication benefits as useAdminAuth.
 * Accepts a `ready` flag so the request is deferred until the auth
 * config provider has finished initialising (required for Clerk mode).
 */
export function useUserAuth(ready = true) {
  const { data, error, isLoading } = useSWR<AppUser>(
    ready ? "/api/users/auth/me" : null,
    swrFetcher,
    { revalidateOnFocus: false, dedupingInterval: 30_000 },
  );
  return { user: data ?? null, error, isLoading };
}
