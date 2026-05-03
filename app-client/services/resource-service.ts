import { apiDelete, apiGet, apiPost, apiPut } from "@/services/api-client";
import type { ResourceListResult } from "@/types";

async function list<T = unknown>(endpoint: string) {
  const result = await apiGet<ResourceListResult<T>>(endpoint);
  return result.data?.items || [];
}

async function create<T = unknown>(endpoint: string, payload: unknown) {
  const result = await apiPost<T>(endpoint, payload);
  return result.data;
}

async function update<T = unknown>(
  endpoint: string,
  id: string,
  payload: unknown,
) {
  const result = await apiPut<T>(`${endpoint}/${id}`, payload);
  return result.data;
}

async function remove(endpoint: string, id: string) {
  await apiDelete(`${endpoint}/${id}`);
}

async function fetchOptions<T = unknown>(endpoint: string): Promise<T[]> {
  const result = await apiGet<{ items: T[] }>(endpoint);
  return result.data?.items ?? [];
}

async function save<T = unknown>(
  endpoint: string,
  payload: Record<string, unknown>,
) {
  return payload?.id
    ? update<T>(endpoint, payload.id as string, payload)
    : create<T>(endpoint, payload);
}

export const resourceService = {
  list,
  create,
  update,
  remove,
  fetchOptions,
  save,
};
