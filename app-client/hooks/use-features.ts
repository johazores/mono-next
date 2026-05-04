"use client";

import { useCallback } from "react";
import useSWR from "swr";
import { swrFeatureFetcher } from "@/lib/swr";

export function useFeatures() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/users/auth/features",
    swrFeatureFetcher,
  );

  const features = data ?? [];

  const hasFeature = useCallback(
    (key: string): boolean => {
      return features.some((f) => f.key === key && f.enabled);
    },
    [features],
  );

  return {
    features,
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : "",
    hasFeature,
    reload: () => mutate(),
  };
}
