"use client";

import { useState, useEffect, useCallback } from "react";
import useSWR from "swr";
import { cmsMediaService } from "@/services/cms-service";
import { mediaUrl } from "@/lib/media-url";
import type { MediaItem } from "@/types";
import { ImageIcon, X, Search, Upload, Check } from "lucide-react";

// ---------------------------------------------------------------------------
// Fetcher
// ---------------------------------------------------------------------------

async function fetchMedia() {
  const result = await cmsMediaService.list();
  return result.data?.items ?? [];
}

// ---------------------------------------------------------------------------
// MediaPickerField — inline field with "Select" button + modal
// ---------------------------------------------------------------------------

type MediaPickerFieldProps = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  /** Show compact variant (for sidebar) vs full-width */
  compact?: boolean;
};

export function MediaPickerField({
  value,
  onChange,
  label,
  compact = false,
}: MediaPickerFieldProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {label && (
        <span className="mb-1 block text-sm font-medium text-[var(--theme-text)]">
          {label}
        </span>
      )}

      {value ? (
        <div className="space-y-2">
          <div className="relative overflow-hidden rounded-lg border border-[var(--theme-border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={mediaUrl(value)}
              alt="Selected media"
              className={`w-full object-cover ${compact ? "h-36" : "h-48"}`}
              onError={(e) =>
                ((e.target as HTMLImageElement).style.display = "none")
              }
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex-1 rounded-md border border-[var(--theme-border)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--theme-surface)]"
              onClick={() => setOpen(true)}
            >
              Replace
            </button>
            <button
              type="button"
              className="rounded-md border border-red-200 px-2 py-1.5 text-red-500 hover:bg-red-50"
              onClick={() => onChange("")}
              title="Remove"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-6 text-sm text-[var(--theme-muted)] transition-colors hover:border-[var(--theme-primary)] hover:text-[var(--theme-primary)]"
          onClick={() => setOpen(true)}
        >
          <ImageIcon size={18} />
          Select from Media Library
        </button>
      )}

      {open && (
        <MediaPickerModal
          currentValue={value}
          onSelect={(url) => {
            onChange(url);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal — shows the media library grid
// ---------------------------------------------------------------------------

type MediaPickerModalProps = {
  currentValue: string;
  onSelect: (url: string) => void;
  onClose: () => void;
};

function MediaPickerModal({
  currentValue,
  onSelect,
  onClose,
}: MediaPickerModalProps) {
  const { data: items = [] } = useSWR<MediaItem[]>(
    "/api/cms/media",
    fetchMedia,
  );
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(currentValue);
  const [tab, setTab] = useState<"library" | "url">("library");
  const [urlInput, setUrlInput] = useState("");

  // Filter images only for the picker
  const images = items.filter(
    (m) =>
      m.mediaType === "image" &&
      (search
        ? m.fileName.toLowerCase().includes(search.toLowerCase()) ||
          (m.altText ?? "").toLowerCase().includes(search.toLowerCase())
        : true),
  );

  // Close on Escape
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="relative flex h-[80vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-[var(--theme-border)] bg-[var(--theme-bg,var(--theme-background))] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--theme-border)] px-5 py-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-[var(--theme-text)]">
              Media Library
            </h2>
            <div className="flex rounded-md border border-[var(--theme-border)]">
              <button
                type="button"
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  tab === "library"
                    ? "bg-[var(--theme-primary)] text-white"
                    : "text-[var(--theme-muted)] hover:bg-[var(--theme-surface)]"
                } rounded-l-md`}
                onClick={() => setTab("library")}
              >
                Library
              </button>
              <button
                type="button"
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  tab === "url"
                    ? "bg-[var(--theme-primary)] text-white"
                    : "text-[var(--theme-muted)] hover:bg-[var(--theme-surface)]"
                } rounded-r-md`}
                onClick={() => setTab("url")}
              >
                URL
              </button>
            </div>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-[var(--theme-muted)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-text)]"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-5">
          {tab === "library" ? (
            <>
              {/* Search */}
              <div className="relative mb-4">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--theme-muted)]"
                />
                <input
                  className="w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] py-1.5 pl-8 pr-3 text-sm"
                  placeholder="Search media..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Upload
                    size={40}
                    className="mb-3 text-[var(--theme-muted)]"
                  />
                  <p className="font-medium text-[var(--theme-text)]">
                    {search
                      ? "No images match your search"
                      : "No images in your media library"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--theme-muted)]">
                    {search
                      ? "Try a different search term."
                      : "Upload images via the Media section, or use the URL tab to enter an image address."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
                  {images.map((img) => {
                    const isSelected = selected === img.url;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-[var(--theme-primary)] ring-2 ring-[var(--theme-primary)]/30"
                            : "border-transparent hover:border-[var(--theme-border)]"
                        }`}
                        onClick={() => setSelected(img.url)}
                        onDoubleClick={() => onSelect(img.url)}
                        title={img.fileName}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={mediaUrl(img.url)}
                          alt={img.altText || img.fileName}
                          className="h-full w-full object-cover"
                          onError={(e) =>
                            ((e.target as HTMLImageElement).style.display =
                              "none")
                          }
                        />
                        {isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-[var(--theme-primary)]/20">
                            <div className="rounded-full bg-[var(--theme-primary)] p-1">
                              <Check size={14} className="text-white" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-2 py-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="truncate text-[10px] text-white">
                            {img.fileName}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* URL tab */
            <div className="space-y-4">
              <p className="text-sm text-[var(--theme-muted)]">
                Paste an external image URL:
              </p>
              <input
                className="w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-2 text-sm"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  setSelected(e.target.value);
                }}
              />
              {urlInput && (
                <div className="overflow-hidden rounded-lg border border-[var(--theme-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={urlInput}
                    alt="Preview"
                    className="h-48 w-full object-contain bg-[var(--theme-surface)]"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).style.display = "none")
                    }
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--theme-border)] px-5 py-3">
          <p className="text-xs text-[var(--theme-muted)]">
            {tab === "library"
              ? `${images.length} image${images.length !== 1 ? "s" : ""} in library`
              : "Enter an external image URL"}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-[var(--theme-border)] px-4 py-1.5 text-sm hover:bg-[var(--theme-surface)]"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              disabled={!selected}
              onClick={() => onSelect(selected)}
            >
              Select
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
