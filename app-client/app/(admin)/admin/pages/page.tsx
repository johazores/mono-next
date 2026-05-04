"use client";

import { useState } from "react";
import useSWR from "swr";
import { PageBuilder } from "@/components/admin/page-builder";
import { BlockRenderer } from "@/components/blocks/block-renderer";
import {
  cmsPageService,
  cmsBlockTemplateService,
} from "@/services/cms-service";
import type { CmsPage, FlexibleBlock, BlockTemplate } from "@/types";

const swrKey = "/api/cms/pages";

async function fetchPages() {
  const result = await cmsPageService.list();
  return result.data?.items ?? [];
}

async function fetchTemplates() {
  const result = await cmsBlockTemplateService.list();
  return result.data?.items ?? [];
}

const emptyPage = {
  title: "",
  slug: "",
  status: "draft",
  seoTitle: "",
  seoDescription: "",
  blocks: [] as FlexibleBlock[],
};

export default function PagesAdminPage() {
  const { data: pages = [], mutate } = useSWR<CmsPage[]>(swrKey, fetchPages);
  const { data: blockTemplates = [] } = useSWR<BlockTemplate[]>(
    "/api/cms/block-templates",
    fetchTemplates,
  );
  const [editing, setEditing] = useState<CmsPage | null>(null);
  const [form, setForm] = useState(emptyPage);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(false);

  function openNew() {
    setEditing(null);
    setForm({ ...emptyPage, blocks: [] });
    setError("");
    setPreview(false);
  }

  function openEdit(page: CmsPage) {
    setEditing(page);
    setForm({
      title: page.title,
      slug: page.slug,
      status: page.status,
      seoTitle: page.seoTitle || "",
      seoDescription: page.seoDescription || "",
      blocks: page.blocks || [],
    });
    setError("");
    setPreview(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await cmsPageService.update(editing.id, form);
      } else {
        await cmsPageService.create(form);
      }
      await mutate();
      setEditing(null);
      setForm({ ...emptyPage, blocks: [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this page?")) return;
    try {
      await cmsPageService.delete(id);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const inputClass =
    "w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-sm";

  // If editing or creating, show the page builder form
  if (editing !== null || form.title !== "" || form.blocks.length > 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--theme-text)]">
            {editing ? "Edit Page" : "New Page"}
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-[var(--theme-border)] px-4 py-1.5 text-sm hover:bg-[var(--theme-surface)]"
              onClick={() => setPreview(!preview)}
            >
              {preview ? "Editor" : "Preview"}
            </button>
            <button
              type="button"
              className="rounded-md border border-[var(--theme-border)] px-4 py-1.5 text-sm hover:bg-[var(--theme-surface)]"
              onClick={() => {
                setEditing(null);
                setForm({ ...emptyPage, blocks: [] });
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

        {preview ? (
          <div className="rounded-lg border border-[var(--theme-border)] bg-white p-6">
            <BlockRenderer blocks={form.blocks} templates={blockTemplates} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <label>
                <span className="text-sm font-medium text-[var(--theme-text)]">
                  Title
                </span>
                <input
                  className={inputClass}
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </label>
              <label>
                <span className="text-sm font-medium text-[var(--theme-text)]">
                  Slug
                </span>
                <input
                  className={inputClass}
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                />
              </label>
              <label>
                <span className="text-sm font-medium text-[var(--theme-text)]">
                  Status
                </span>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label>
                <span className="text-sm font-medium text-[var(--theme-text)]">
                  SEO Title
                </span>
                <input
                  className={inputClass}
                  value={form.seoTitle}
                  onChange={(e) =>
                    setForm({ ...form, seoTitle: e.target.value })
                  }
                />
              </label>
              <label className="col-span-2">
                <span className="text-sm font-medium text-[var(--theme-text)]">
                  SEO Description
                </span>
                <textarea
                  rows={2}
                  className={inputClass}
                  value={form.seoDescription}
                  onChange={(e) =>
                    setForm({ ...form, seoDescription: e.target.value })
                  }
                />
              </label>
            </div>

            <h2 className="text-lg font-semibold text-[var(--theme-text)]">
              Page Blocks
            </h2>
            <PageBuilder
              value={form.blocks}
              onChange={(blocks) => setForm({ ...form, blocks })}
            />
          </>
        )}
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--theme-text)]">Pages</h1>
        <button
          type="button"
          className="rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
          onClick={openNew}
        >
          New Page
        </button>
      </div>

      {pages.length === 0 && (
        <p className="text-sm text-[var(--theme-muted)]">
          No pages yet. Create your first page.
        </p>
      )}

      <div className="space-y-2">
        {pages.map((page) => (
          <div
            key={page.id}
            className="flex items-center justify-between rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3"
          >
            <div>
              <p className="font-medium text-[var(--theme-text)]">
                {page.title}
              </p>
              <p className="text-xs text-[var(--theme-muted)]">
                /{page.slug} · {page.status} · {(page.blocks || []).length}{" "}
                blocks
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-sm text-[var(--theme-primary)] hover:underline"
                onClick={() => openEdit(page)}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-sm text-red-500 hover:underline"
                onClick={() => handleDelete(page.id)}
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
