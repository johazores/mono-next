import { featureRepository } from "@/repositories/feature-repository";
import type { FeatureDefinition } from "@/types";

let cache: FeatureDefinition[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 60_000; // 1 minute

export async function getAllFeatures(): Promise<FeatureDefinition[]> {
  const now = Date.now();
  if (cache && now < cacheExpiry) return cache;

  const rows = await featureRepository.list();
  cache = rows.map((r) => ({
    key: r.key,
    description: r.description,
    category: r.category,
  }));
  cacheExpiry = now + CACHE_TTL;
  return cache;
}

export function invalidateFeatureCache(): void {
  cache = null;
  cacheExpiry = 0;
}

export async function getFeatureDefinition(
  key: string,
): Promise<FeatureDefinition | undefined> {
  const features = await getAllFeatures();
  return features.find((f) => f.key === key);
}

export function isFeatureEnabled(planFeatures: string[], key: string): boolean {
  return planFeatures.includes(key);
}

export async function getEnabledFeatures(
  planFeatures: string[],
): Promise<FeatureDefinition[]> {
  const all = await getAllFeatures();
  const set = new Set(planFeatures);
  return all.filter((f) => set.has(f.key));
}
