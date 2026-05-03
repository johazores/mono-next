"use client";

import { useCallback, useEffect, useState } from "react";
import { resourceService } from "@/services/resource-service";
import type { AdminResourceState } from "@/types";

export function useAdminResource<T>(endpoint: string) {
  const [state, setState] = useState<AdminResourceState<T>>({
    items: [],
    loading: true,
    error: "",
  });

  const load = useCallback(async () => {
    try {
      const items = await resourceService.list<T>(endpoint);
      setState({ items, loading: false, error: "" });
    } catch (err) {
      setState((current) => ({
        ...current,
        loading: false,
        error: err instanceof Error ? err.message : "Failed to load.",
      }));
    }
  }, [endpoint]);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    return () => window.clearInterval(timer);
  }, [load]);

  return { ...state, reload: load };
}
