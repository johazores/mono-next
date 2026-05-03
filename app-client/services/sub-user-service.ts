import { apiGet, apiPost, apiDelete } from "@/services/api-client";
import type { SubUser, CreateSubUserInput, CreateSubUserResult } from "@/types";

const ENDPOINT = "/api/users/auth/sub-users";

export const subUserService = {
  async list(): Promise<SubUser[]> {
    const result = await apiGet<{ items: SubUser[] }>(ENDPOINT);
    return result.data?.items ?? [];
  },

  async create(input: CreateSubUserInput): Promise<CreateSubUserResult> {
    const result = await apiPost<CreateSubUserResult>(ENDPOINT, input);
    return result.data!;
  },

  async revoke(id: string): Promise<void> {
    await apiDelete(`${ENDPOINT}/${id}`);
  },
};
