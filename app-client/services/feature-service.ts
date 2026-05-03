import { apiGet } from "@/services/api-client";

export type FeatureFlag = {
  key: string;
  description: string;
  category: string;
  enabled: boolean;
  source: "direct" | "inherited";
};

export async function getMyFeatures(): Promise<FeatureFlag[]> {
  const result = await apiGet<{ features: FeatureFlag[] }>(
    "/api/users/auth/features",
  );
  return result.data?.features ?? [];
}
