"use client";

import { useCallback, useEffect, useState } from "react";
import { getMyFeatures } from "@/services/feature-service";
import type { FeatureFlag } from "@/types";

type FeaturesState = {
  features: FeatureFlag[];
  loading: boolean;
  error: string;
};

export function useFeatures() {
  const [state, setState] = useState<FeaturesState>({
    features: [],
    loading: true,
    error: "",
  });

  const load = useCallback(async () => {
    try {
      const features = await getMyFeatures();
      setState({ features, loading: false, error: "" });
    } catch (err) {
      setState((current) => ({
        ...current,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load features.",
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const hasFeature = useCallback(
    (key: string): boolean => {
      return state.features.some((f) => f.key === key && f.enabled);
    },
    [state.features],
  );

  return { ...state, hasFeature, reload: load };
}
