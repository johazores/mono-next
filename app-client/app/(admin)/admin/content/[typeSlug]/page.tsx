"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import {
  cmsContentService,
  cmsContentTypeService,
} from "@/services/cms-service";
import { mediaUrl } from "@/lib/media-url";
import { slugify } from "@/lib/slugify";
import type { ContentItem, ContentType } from "@/types";
import { MediaPickerField } from "@/components/admin/media-picker";
import {
  AlertTriangle,
  Settings,
  Image as ImageIcon,
  Calendar,
  Eye,
  MessageSquare,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Standard fields every content item gets (WordPress-like)
// ---------------------------------------------------------------------------

const STANDARD_FIELD_NAMES = [
  "body",
  "excerpt",
  "featuredImage",
  "author",
  "publishedAt",
  "visibility",
  "allowComments",
  "format",
  "template",
] as const;

// ---------------------------------------------------------------------------
// Data fetchers
// ---------------------------------------------------------------------------

async function fetchContentType(typeSlug: string) {
  const result = await cmsContentTypeService.list();
  return (result.data?.items ?? []).find(
    (ct: ContentType) => ct.slug === typeSlug,
  );
}

async function fetchItems(typeSlug: string) {
  const result = await cmsContentService.list(typeSlug);
  return result.data?.items ?? [];
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ContentItemsPage() {
  const { typeSlug } = useParams<{ typeSlug: string }>();
  const { data: contentType } = useSWR(`ct-${typeSlug}`, () =>
    fetchContentType(typeSlug),
  );
  const { data: items = [], mutate } = useSWR<ContentItem[]>(
    `content-${typeSlug}`,
    () => fetchItems(typeSlug),
  );

  const [editing, setEditing] = useState<ContentItem | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fields = contentType?.fields ?? [];

  // Derive custom fields = type-defined fields minus any that overlap standard names
  const standardSet = new Set<string>(STANDARD_FIELD_NAMES);
  const customFields = fields.filter((f) => !standardSet.has(f.name));

  function openNew() {
    setEditing(null);
    const empty: Record<string, string> = {
      title: "",
      slug: "",
      status: "draft",
      body: "",
      excerpt: "",
      featuredImage: "",
      author: "",
      publishedAt: "",
      visibility: "public",
      allowComments: "true",
      format: "standard",
      template: "",
    };
    for (const f of fields) empty[f.name] = "";
    setForm(empty);
    setError("");
  }

  function openEdit(item: ContentItem) {
    setEditing(item);
    const itemData = (item.data ?? {}) as Record<string, unknown>;
    const data: Record<string, string> = {
      title: item.title || "",
      slug: item.slug || "",
      status: item.status || "draft",
      body: String(itemData.body ?? ""),
      excerpt: String(itemData.excerpt ?? ""),
      featuredImage: String(itemData.featuredImage ?? ""),
      author: String(itemData.author ?? ""),
      publishedAt: String(itemData.publishedAt ?? ""),
      visibility: String(itemData.visibility ?? "public"),
      allowComments: String(itemData.allowComments ?? "true"),
      format: String(itemData.format ?? "standard"),
      template: String(itemData.template ?? ""),
    };
    for (const f of fields) {
      if (!(f.name in data)) {
        data[f.name] = String(itemData[f.name] ?? "");
      }
    }
    setForm(data);
    setError("");
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await cmsContentService.update(typeSlug, editing.id, form);
      } else {
        await cmsContentService.create(typeSlug, form);
      }
      await mutate();
      setEditing(null);
      setForm({});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this item?")) return;
    try {
      await cmsContentService.delete(typeSlug, id);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const inputClass =
    "w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-sm";
  const cardClass =
    "rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg,var(--theme-background))] shadow-sm";
  const sectionTitle =
    "mb-3 text-xs font-semibold text-[var(--theme-muted)] uppercase tracking-wide";

  const isEditing = editing !== null || Object.keys(form).length > 0;

  // =========================================================================
  // EDITOR VIEW — WordPress-like 2-column layout
  // =========================================================================

  if (isEditing) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--theme-text)]">
            {editing ? "Edit" : "New"} {contentType?.name || typeSlug}
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-[var(--theme-border)] px-4 py-1.5 text-sm hover:bg-[var(--theme-surface)]"
              onClick={() => {
                setEditing(null);
                setForm({});
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              disabled={saving}
              onClick={handleSave}
            >
              {saving
                ? "Saving..."
                : form.status === "published"
                  ? "Publish"
                  : "Save Draft"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* 2-column layout: main + sidebar */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
          {/* ---- MAIN COLUMN ---- */}
          <div className="space-y-5">
            {/* Title */}
            <div className={`${cardClass} p-5`}>
              <label>
                <span className="text-sm font-medium text-[var(--theme-text)]">
                  Title
                </span>
                <input
                  className={`${inputClass} mt-1 text-lg font-medium`}
                  value={form.title || ""}
                  placeholder="Enter title..."
                  onChange={(e) => {
                    const title = e.target.value;
                    const patch: Record<string, string> = { ...form, title };
                    if (!form.slug || form.slug === slugify(form.title || "")) {
                      patch.slug = slugify(title);
                    }
                    setForm(patch);
                  }}
                />
              </label>
              {/* Permalink with URL prefix */}
              {(() => {
                const ps = contentType?.publicSettings;
                const prefix =
                  ps?.urlPrefix || `/${contentType?.slug || typeSlug}`;
                return (
                  <div className="mt-2 flex items-center gap-1 text-xs text-[var(--theme-muted)]">
                    <span className="shrink-0">Permalink:</span>
                    <span className="shrink-0 font-mono text-[var(--theme-text)]">
                      {prefix}/
                    </span>
                    <input
                      className="flex-1 rounded border border-[var(--theme-border)] bg-[var(--theme-surface)] px-2 py-0.5 text-xs font-mono"
                      value={form.slug || ""}
                      onChange={(e) => set("slug", e.target.value)}
                      placeholder={
                        form.title ? slugify(form.title) : "item-slug"
                      }
                    />
                  </div>
                );
              })()}
            </div>

            {/* Content / Body */}
            <div className={`${cardClass} p-5`}>
              <h3 className={sectionTitle}>Content</h3>
              <textarea
                rows={12}
                className={`${inputClass} font-mono`}
                value={form.body || ""}
                onChange={(e) => set("body", e.target.value)}
                placeholder="Write your content here..."
              />
            </div>

            {/* Excerpt */}
            <div className={`${cardClass} p-5`}>
              <h3 className={sectionTitle}>Excerpt</h3>
              <textarea
                rows={3}
                className={inputClass}
                value={form.excerpt || ""}
                onChange={(e) => set("excerpt", e.target.value)}
                placeholder="Optional hand-crafted summary for listings and SEO..."
              />
              <p className="mt-1 text-xs text-[var(--theme-muted)]">
                Excerpts are optional short summaries. If blank, an automatic
                excerpt will be generated from the content.
              </p>
            </div>

            {/* Custom Fields from content type definition */}
            {customFields.length > 0 && (
              <div className={`${cardClass} p-5`}>
                <h3 className={sectionTitle}>{contentType?.name} Fields</h3>
                <div className="grid grid-cols-2 gap-4">
                  {customFields.map((field) => (
                    <label
                      key={field.name}
                      className={
                        field.width === "full" ||
                        field.type === "textarea" ||
                        field.type === "rich-text"
                          ? "col-span-2"
                          : ""
                      }
                    >
                      <span className="text-sm font-medium text-[var(--theme-text)]">
                        {field.label}
                        {field.required && (
                          <span className="ml-1 text-red-400">*</span>
                        )}
                      </span>
                      {field.type === "textarea" ||
                      field.type === "rich-text" ? (
                        <textarea
                          rows={field.type === "rich-text" ? 8 : 3}
                          className={inputClass}
                          value={form[field.name] || ""}
                          onChange={(e) => set(field.name, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      ) : field.type === "select" ? (
                        <select
                          className={inputClass}
                          value={form[field.name] || ""}
                          onChange={(e) => set(field.name, e.target.value)}
                        >
                          <option value="">Select...</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : field.type === "boolean" ? (
                        <div className="mt-1">
                          <label className="inline-flex cursor-pointer items-center gap-2">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-[var(--theme-border)]"
                              checked={form[field.name] === "true"}
                              onChange={(e) =>
                                set(field.name, String(e.target.checked))
                              }
                            />
                            <span className="text-sm text-[var(--theme-text)]">
                              {field.label}
                            </span>
                          </label>
                        </div>
                      ) : field.type === "date" ? (
                        <input
                          type="datetime-local"
                          className={inputClass}
                          value={form[field.name] || ""}
                          onChange={(e) => set(field.name, e.target.value)}
                        />
                      ) : field.type === "url" ? (
                        <input
                          type="url"
                          className={inputClass}
                          value={form[field.name] || ""}
                          onChange={(e) => set(field.name, e.target.value)}
                          placeholder={field.placeholder || "https://"}
                        />
                      ) : field.type === "media" ? (
                        <MediaPickerField
                          value={form[field.name] || ""}
                          onChange={(url) => set(field.name, url)}
                        />
                      ) : (
                        <input
                          className={inputClass}
                          type={field.type === "number" ? "number" : "text"}
                          value={form[field.name] || ""}
                          onChange={(e) => set(field.name, e.target.value)}
                          placeholder={field.placeholder}
                        />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ---- SIDEBAR ---- */}
          <div className="space-y-5">
            {/* Publish box */}
            <div className={`${cardClass} p-4`}>
              <h3 className={sectionTitle}>Publish</h3>

              <div className="space-y-3">
                {/* Status */}
                <label className="block">
                  <span className="text-xs font-medium text-[var(--theme-muted)]">
                    Status
                  </span>
                  <select
                    className={inputClass}
                    value={form.status || "draft"}
                    onChange={(e) => set("status", e.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="pending">Pending Review</option>
                    <option value="private">Private</option>
                    <option value="scheduled">Scheduled</option>
                  </select>
                </label>

                {/* Visibility */}
                <label className="block">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--theme-muted)]">
                    <Eye size={12} />
                    Visibility
                  </span>
                  <select
                    className={inputClass}
                    value={form.visibility || "public"}
                    onChange={(e) => set("visibility", e.target.value)}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="password">Password Protected</option>
                  </select>
                </label>

                {/* Published Date */}
                <label className="block">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--theme-muted)]">
                    <Calendar size={12} />
                    Publish Date
                  </span>
                  <input
                    type="datetime-local"
                    className={inputClass}
                    value={form.publishedAt || ""}
                    onChange={(e) => set("publishedAt", e.target.value)}
                  />
                  <span className="text-[10px] text-[var(--theme-muted)]">
                    Leave empty for immediate publish
                  </span>
                </label>

                {/* Author */}
                <label className="block">
                  <span className="text-xs font-medium text-[var(--theme-muted)]">
                    Author
                  </span>
                  <input
                    className={inputClass}
                    value={form.author || ""}
                    onChange={(e) => set("author", e.target.value)}
                    placeholder="Author name"
                  />
                </label>
              </div>

              {/* Action buttons */}
              <div className="mt-4 flex gap-2 border-t border-[var(--theme-border)] pt-3">
                <button
                  type="button"
                  className="flex-1 rounded-md border border-[var(--theme-border)] px-3 py-1.5 text-sm hover:bg-[var(--theme-surface)]"
                  onClick={() => {
                    set("status", "draft");
                    handleSave();
                  }}
                  disabled={saving}
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-md bg-[var(--theme-primary)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                  onClick={() => {
                    set("status", "published");
                    handleSave();
                  }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Publish"}
                </button>
              </div>
            </div>

            {/* Format */}
            <div className={`${cardClass} p-4`}>
              <h3 className={sectionTitle}>Format</h3>
              <select
                className={inputClass}
                value={form.format || "standard"}
                onChange={(e) => set("format", e.target.value)}
              >
                <option value="standard">Standard</option>
                <option value="aside">Aside</option>
                <option value="gallery">Gallery</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="quote">Quote</option>
                <option value="link">Link</option>
                <option value="image">Image</option>
                <option value="status">Status Update</option>
              </select>
            </div>

            {/* Featured Image */}
            <div className={`${cardClass} p-4`}>
              <h3 className={`${sectionTitle} flex items-center gap-1`}>
                <ImageIcon size={12} />
                Featured Image
              </h3>
              <MediaPickerField
                value={form.featuredImage || ""}
                onChange={(url) => set("featuredImage", url)}
                compact
              />
            </div>

            {/* Discussion */}
            <div className={`${cardClass} p-4`}>
              <h3 className={`${sectionTitle} flex items-center gap-1`}>
                <MessageSquare size={12} />
                Discussion
              </h3>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--theme-border)]"
                  checked={form.allowComments === "true"}
                  onChange={(e) =>
                    set("allowComments", String(e.target.checked))
                  }
                />
                <span className="text-sm text-[var(--theme-text)]">
                  Allow comments
                </span>
              </label>
            </div>

            {/* Page Attributes */}
            <div className={`${cardClass} p-4`}>
              <h3 className={sectionTitle}>Page Attributes</h3>
              <div className="space-y-3">
                <label className="block">
                  <span className="text-xs font-medium text-[var(--theme-muted)]">
                    Template
                  </span>
                  <select
                    className={inputClass}
                    value={form.template || ""}
                    onChange={(e) => set("template", e.target.value)}
                  >
                    <option value="">Default Template</option>
                    <option value="full-width">Full Width</option>
                    <option value="sidebar-left">Sidebar Left</option>
                    <option value="sidebar-right">Sidebar Right</option>
                    <option value="landing">Landing Page</option>
                    <option value="blank">Blank (No Header/Footer)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs font-medium text-[var(--theme-muted)]">
                    Order
                  </span>
                  <input
                    type="number"
                    className={inputClass}
                    value={form.sortOrder || "0"}
                    onChange={(e) => set("sortOrder", e.target.value)}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // LIST VIEW
  // =========================================================================

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--theme-text)]">
          {contentType?.pluralName || contentType?.name || typeSlug}
        </h1>
        <div className="flex gap-2">
          {contentType?.id && (
            <Link
              href={`/admin/content-types/${contentType.id}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--theme-border)] px-3 py-1.5 text-sm text-[var(--theme-muted)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-text)] transition-colors"
            >
              <Settings size={14} />
              Configure
            </Link>
          )}
          <button
            type="button"
            className="rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
            onClick={openNew}
          >
            New {contentType?.name || "Item"}
          </button>
        </div>
      </div>

      {items.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-bg,var(--theme-background))] p-10 text-center">
          <p className="font-medium text-[var(--theme-text)]">No items yet</p>
          <p className="mt-1 text-sm text-[var(--theme-muted)]">
            Create your first {contentType?.name?.toLowerCase() || "item"} to
            get started.
          </p>
          <button
            type="button"
            className="mt-3 rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
            onClick={openNew}
          >
            Create {contentType?.name || "Item"}
          </button>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item) => {
          const itemData = (item.data ?? {}) as Record<string, unknown>;
          const img = itemData.featuredImage as string | undefined;
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3"
            >
              {img && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={mediaUrl(img)}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                  onError={(e) =>
                    ((e.target as HTMLImageElement).style.display = "none")
                  }
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-[var(--theme-text)]">
                  {item.title}
                </p>
                <p className="truncate text-xs text-[var(--theme-muted)]">
                  {contentType?.publicSettings?.urlPrefix ||
                    `/${contentType?.slug || typeSlug}`}
                  /{item.slug} ·{" "}
                  <span
                    className={
                      item.status === "published"
                        ? "text-green-600"
                        : item.status === "draft"
                          ? "text-amber-600"
                          : "text-[var(--theme-muted)]"
                    }
                  >
                    {item.status}
                  </span>
                  {itemData.author ? ` · ${String(itemData.author)}` : null}
                  {item.updatedAt &&
                    ` · ${new Date(item.updatedAt).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  className="text-sm text-[var(--theme-primary)] hover:underline"
                  onClick={() => openEdit(item)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-sm text-red-500 hover:underline"
                  onClick={() => handleDelete(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
