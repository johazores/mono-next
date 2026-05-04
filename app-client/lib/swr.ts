import { apiGet } from "@/services/api-client";
import type { FeatureFlag } from "@/types";

/**
 * Default SWR fetcher — delegates to the existing apiGet which handles
 * auth headers, credentials, and error parsing.
 * Returns `result.data` so SWR consumers get the payload directly.
 */
export async function swrFetcher<T>(url: string): Promise<T> {
  const result = await apiGet<T>(url);
  return result.data as T;
}

/**
 * SWR fetcher for list endpoints that return `{ items: T[] }`.
 * Unwraps the items array so consumers get `T[]` directly.
 */
export async function swrListFetcher<T>(url: string): Promise<T[]> {
  const result = await apiGet<{ items: T[] }>(url);
  return result.data?.items ?? [];
}

/**
 * SWR fetcher for the features endpoint that returns `{ features: FeatureFlag[] }`.
 */
export async function swrFeatureFetcher(url: string): Promise<FeatureFlag[]> {
  const result = await apiGet<{ features: FeatureFlag[] }>(url);
  return result.data?.features ?? [];
}
