"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import {
  cmsContentService,
  cmsContentTypeService,
} from "@/services/cms-service";
import type { ContentItem, ContentType } from "@/types";

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

  function openNew() {
    setEditing(null);
    const empty: Record<string, string> = {
      title: "",
      slug: "",
      status: "draft",
    };
    for (const f of fields) empty[f.name] = "";
    setForm(empty);
    setError("");
  }

  function openEdit(item: ContentItem) {
    setEditing(item);
    const data: Record<string, string> = {
      title: item.title || "",
      slug: item.slug || "",
      status: item.status || "draft",
    };
    const itemData = (item.data ?? {}) as Record<string, unknown>;
    for (const f of fields) {
      data[f.name] = String(itemData[f.name] ?? "");
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

  const inputClass =
    "w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-sm";

  const isEditing = editing !== null || Object.keys(form).length > 0;

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--theme-text)]">
            {editing ? "Edit" : "New"} {contentType?.name || typeSlug}
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-[var(--theme-border)] px-4 py-1.5 text-sm"
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
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className="text-sm font-medium text-[var(--theme-text)]">
              Title
            </span>
            <input
              className={inputClass}
              value={form.title || ""}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label>
            <span className="text-sm font-medium text-[var(--theme-text)]">
              Slug
            </span>
            <input
              className={inputClass}
              value={form.slug || ""}
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </label>
          <label>
            <span className="text-sm font-medium text-[var(--theme-text)]">
              Status
            </span>
            <select
              className={inputClass}
              value={form.status || "draft"}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>
          {fields.map((field) => (
            <label
              key={field.name}
              className={
                field.type === "textarea" || field.type === "rich-text"
                  ? "col-span-2"
                  : ""
              }
            >
              <span className="text-sm font-medium text-[var(--theme-text)]">
                {field.label}
              </span>
              {field.type === "textarea" || field.type === "rich-text" ? (
                <textarea
                  rows={4}
                  className={inputClass}
                  value={form[field.name] || ""}
                  onChange={(e) =>
                    setForm({ ...form, [field.name]: e.target.value })
                  }
                />
              ) : field.type === "select" ? (
                <select
                  className={inputClass}
                  value={form[field.name] || ""}
                  onChange={(e) =>
                    setForm({ ...form, [field.name]: e.target.value })
                  }
                >
                  <option value="">Select...</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className={inputClass}
                  type={field.type === "number" ? "number" : "text"}
                  value={form[field.name] || ""}
                  onChange={(e) =>
                    setForm({ ...form, [field.name]: e.target.value })
                  }
                />
              )}
            </label>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--theme-text)]">
          {contentType?.pluralName || contentType?.name || typeSlug}
        </h1>
        <button
          type="button"
          className="rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
          onClick={openNew}
        >
          New {contentType?.name || "Item"}
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-[var(--theme-muted)]">No items yet.</p>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3"
          >
            <div>
              <p className="font-medium text-[var(--theme-text)]">
                {item.title}
              </p>
              <p className="text-xs text-[var(--theme-muted)]">
                /{item.slug} · {item.status}
              </p>
            </div>
            <div className="flex gap-2">
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
        ))}
      </div>
    </div>
  );
}
