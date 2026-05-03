import { apiGet } from "@/services/api-client";
import type { PurchaseDownload } from "@/types";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

export const downloadService = {
  async listDownloads(): Promise<PurchaseDownload[]> {
    const result = await apiGet<{ items: PurchaseDownload[] }>(
      "/api/users/auth/downloads",
    );
    return result.data?.items ?? [];
  },

  getDownloadUrl(fileId: string): string {
    return `${baseUrl}/api/users/auth/downloads/${fileId}`;
  },
};
