"use client";

import { useEffect, useState } from "react";
import { downloadService } from "@/services/download-service";
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
  const [downloads, setDownloads] = useState<PurchaseDownload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    downloadService
      .listDownloads()
      .then(setDownloads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-sm text-gray-400">Loading downloads&hellip;</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Downloads</h1>
        <p className="mt-1 text-sm text-gray-500">
          Access files from your purchased products.
        </p>
      </div>

      {downloads.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <p className="text-sm text-gray-500">
            No downloadable files yet. Purchase a digital product to see your
            files here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {downloads.map((dl) => (
            <div
              key={dl.purchaseId}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    {dl.productName}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Purchased {formatDate(dl.purchaseDate)}
                  </p>
                </div>
                <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                  {dl.productType}
                </span>
              </div>

              <ul className="mt-3 divide-y divide-gray-100">
                {dl.files.map((file) => (
                  <li
                    key={file.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {file.fileName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {file.mimeType} &middot; {formatSize(file.sizeBytes)}
                      </p>
                    </div>
                    <a
                      href={downloadService.getDownloadUrl(file.id)}
                      className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
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
