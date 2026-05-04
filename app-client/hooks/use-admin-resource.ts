"use client";

import useSWR from "swr";
import { resourceService } from "@/services/resource-service";

export function useAdminResource<T>(endpoint: string) {
  const { data, error, isLoading, mutate } = useSWR<T[]>(
    endpoint,
    () => resourceService.list<T>(endpoint),
    {
      refreshInterval: 30_000,
      refreshWhenHidden: false,
      refreshWhenOffline: false,
      revalidateOnFocus: true,
      dedupingInterval: 5_000,
    },
  );

  return {
    items: data ?? [],
    loading: isLoading,
    error: error instanceof Error ? error.message : error ? String(error) : "",
    reload: () => mutate(),
  };
}
