"use client";

import { useRef, useState } from "react";
import useSWR from "swr";
import { cmsMediaService } from "@/services/cms-service";
import { mediaUrl } from "@/lib/media-url";
import type { MediaItem } from "@/types";

const swrKey = "/api/cms/media";

async function fetchMedia() {
  const result = await cmsMediaService.list();
  return result.data?.items ?? [];
}

export default function MediaPage() {
  const { data: media = [], mutate } = useSWR<MediaItem[]>(swrKey, fetchMedia);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(",")[1]);
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(file);
      });
      await cmsMediaService.create({
        fileName: file.name,
        mimeType: file.type,
        size: file.size,
        altText: file.name.replace(/\.[^.]+$/, ""),
        base64Data: base64,
      });
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this media item?")) return;
    try {
      await cmsMediaService.delete(id);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--theme-text)]">Media</h1>
        <label className="cursor-pointer rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90">
          {uploading ? "Uploading..." : "Upload"}
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {media.length === 0 && (
        <p className="text-sm text-[var(--theme-muted)]">
          No media uploaded yet.
        </p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {media.map((item) => (
          <div
            key={item.id}
            className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] overflow-hidden"
          >
            {item.mimeType?.startsWith("image/") ? (
              <img
                src={mediaUrl(item.url)}
                alt={item.altText || item.fileName}
                className="w-full h-32 object-cover"
              />
            ) : (
              <div className="w-full h-32 flex items-center justify-center bg-[var(--theme-bg)]">
                <span className="text-sm text-[var(--theme-muted)]">
                  {item.mimeType}
                </span>
              </div>
            )}
            <div className="p-2">
              <p className="text-xs font-medium text-[var(--theme-text)] truncate">
                {item.fileName}
              </p>
              <button
                type="button"
                className="text-xs text-red-500 hover:underline mt-1"
                onClick={() => handleDelete(item.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
