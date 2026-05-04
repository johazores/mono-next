"use client";

import useSWR from "swr";
import { swrListFetcher } from "@/lib/swr";
import { downloadService } from "@/services/download-service";
import { PageHeader, EmptyState } from "@/components/ui";
import type { PurchaseDownload } from "@/types";

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function DownloadsPage() {
  const { data: downloads = [], isLoading: loading } = useSWR(
    "/api/users/auth/downloads",
    (url: string) => swrListFetcher<PurchaseDownload>(url),
  );

  if (loading) {
    return <p className="text-sm text-muted">Loading downloads&hellip;</p>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Downloads"
        description="Access files from your purchased products."
      />

      {downloads.length === 0 ? (
        <EmptyState message="No downloadable files yet. Purchase a digital product to see your files here." />
      ) : (
        <div className="space-y-4">
          {downloads.map((dl) => (
            <div
              key={dl.purchaseId}
              className="rounded-xl border border-border bg-background p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {dl.productName}
                  </h3>
                  <p className="text-xs text-muted">
                    Purchased {formatDate(dl.purchaseDate)}
                  </p>
                </div>
                <span className="inline-block rounded bg-surface px-2 py-0.5 text-xs text-muted">
                  {dl.productType}
                </span>
              </div>

              <ul className="mt-3 divide-y divide-border">
                {dl.files.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-muted">
                        {file.mimeType} &middot; {formatSize(file.sizeBytes)}
                      </p>
                    </div>
                    <a
                      href={downloadService.getDownloadUrl(file.id)}
                      className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-hover"
                    >
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
