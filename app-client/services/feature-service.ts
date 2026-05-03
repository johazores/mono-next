import { apiGet } from "@/services/api-client";
import type { FeatureFlag } from "@/types";

export async function getMyFeatures(): Promise<FeatureFlag[]> {
  const result = await apiGet<{ features: FeatureFlag[] }>(
    "/api/users/auth/features",
  );
  return result.data?.features ?? [];
}
