"use client";

import { useState } from "react";
import useSWR from "swr";
import { cmsBlockTemplateService } from "@/services/cms-service";
import type {
  BlockTemplate,
  ContentFieldDefinition,
  ContentFieldType,
} from "@/types";

const swrKey = "/api/cms/block-templates";

async function fetchTemplates() {
  const result = await cmsBlockTemplateService.list();
  return result.data?.items ?? [];
}

const FIELD_TYPES: { value: ContentFieldType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "textarea", label: "Textarea" },
  { value: "rich-text", label: "Rich Text (HTML)" },
  { value: "number", label: "Number" },
  { value: "boolean", label: "Boolean" },
  { value: "url", label: "URL" },
  { value: "select", label: "Select" },
  { value: "date", label: "Date" },
  { value: "media", label: "Media / Image" },
  { value: "repeater", label: "Repeater (sub-fields)" },
  { value: "gallery-list", label: "Gallery" },
  { value: "document-list", label: "Documents" },
];

const CATEGORIES = ["layout", "content", "media", "cta"];

const emptyField: ContentFieldDefinition = {
  name: "",
  label: "",
  type: "text",
  width: "full",
};

// ---------------------------------------------------------------------------
// Field builder — edits an array of ContentFieldDefinition
// ---------------------------------------------------------------------------

function FieldBuilder({
  fields,
  onChange,
  depth = 0,
}: {
  fields: ContentFieldDefinition[];
  onChange: (fields: ContentFieldDefinition[]) => void;
  depth?: number;
}) {
  const inputClass =
    "w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-sm";

  function updateField(index: number, patch: Partial<ContentFieldDefinition>) {
    onChange(fields.map((f, i) => (i === index ? { ...f, ...patch } : f)));
  }

  function removeField(index: number) {
    onChange(fields.filter((_, i) => i !== index));
  }

  function moveField(from: number, to: number) {
    const next = [...fields];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  }

  return (
    <div className="space-y-3">
      {fields.map((field, index) => (
        <div
          key={index}
          className="rounded-lg border border-[var(--theme-border)] p-3"
          style={{ marginLeft: depth * 16 }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[var(--theme-text)]">
              Field {index + 1}: {field.label || "(unnamed)"}
            </span>
            <div className="flex gap-1 text-xs">
              {index > 0 && (
                <button
                  type="button"
                  className="text-[var(--theme-muted)] hover:text-[var(--theme-text)]"
                  onClick={() => moveField(index, index - 1)}
                >
                  Up
                </button>
              )}
              {index < fields.length - 1 && (
                <button
                  type="button"
                  className="text-[var(--theme-muted)] hover:text-[var(--theme-text)]"
                  onClick={() => moveField(index, index + 1)}
                >
                  Down
                </button>
              )}
              <button
                type="button"
                className="text-red-500 hover:text-red-700"
                onClick={() => removeField(index)}
              >
                Remove
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-2">
            <label>
              <span className="text-xs text-[var(--theme-muted)]">
                Name (key)
              </span>
              <input
                className={inputClass}
                value={field.name}
                onChange={(e) => updateField(index, { name: e.target.value })}
                placeholder="field_name"
              />
            </label>
            <label>
              <span className="text-xs text-[var(--theme-muted)]">Label</span>
              <input
                className={inputClass}
                value={field.label}
                onChange={(e) => updateField(index, { label: e.target.value })}
                placeholder="Display Label"
              />
            </label>
            <label>
              <span className="text-xs text-[var(--theme-muted)]">Type</span>
              <select
                className={inputClass}
                value={field.type}
                onChange={(e) =>
                  updateField(index, {
                    type: e.target.value as ContentFieldType,
                  })
                }
              >
                {FIELD_TYPES.map((ft) => (
                  <option key={ft.value} value={ft.value}>
                    {ft.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="text-xs text-[var(--theme-muted)]">Width</span>
              <select
                className={inputClass}
                value={field.width || "full"}
                onChange={(e) =>
                  updateField(index, {
                    width: e.target.value as "full" | "half",
                  })
                }
              >
                <option value="full">Full</option>
                <option value="half">Half</option>
              </select>
            </label>
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            <label>
              <span className="text-xs text-[var(--theme-muted)]">
                Placeholder
              </span>
              <input
                className={inputClass}
                value={field.placeholder || ""}
                onChange={(e) =>
                  updateField(index, {
                    placeholder: e.target.value || undefined,
                  })
                }
              />
            </label>
            <label className="flex items-end gap-2 pb-1">
              <input
                type="checkbox"
                checked={field.required || false}
                onChange={(e) =>
                  updateField(index, { required: e.target.checked })
                }
              />
              <span className="text-xs text-[var(--theme-muted)]">
                Required
              </span>
            </label>
            {field.type === "select" && (
              <label className="col-span-2">
                <span className="text-xs text-[var(--theme-muted)]">
                  Options (comma-separated)
                </span>
                <input
                  className={inputClass}
                  value={(field.options || []).join(", ")}
                  onChange={(e) =>
                    updateField(index, {
                      options: e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="option1, option2, option3"
                />
              </label>
            )}
          </div>

          {/* Sub-fields for repeater */}
          {field.type === "repeater" && depth < 1 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--theme-muted)]">
                  Sub-fields
                </span>
                <button
                  type="button"
                  className="text-xs text-[var(--theme-primary)] hover:underline"
                  onClick={() =>
                    updateField(index, {
                      subFields: [
                        ...(field.subFields || []),
                        { ...emptyField },
                      ],
                    })
                  }
                >
                  + Add Sub-field
                </button>
              </div>
              <FieldBuilder
                fields={field.subFields || []}
                onChange={(subFields) => updateField(index, { subFields })}
                depth={depth + 1}
              />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        className="text-sm text-[var(--theme-primary)] hover:underline"
        onClick={() => onChange([...fields, { ...emptyField }])}
      >
        + Add Field
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BlockTemplatesPage() {
  const { data: templates = [], mutate } = useSWR<BlockTemplate[]>(
    swrKey,
    fetchTemplates,
  );
  const [editing, setEditing] = useState<BlockTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    icon: "",
    category: "content",
    fields: [] as ContentFieldDefinition[],
    status: "active",
    sortOrder: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function openNew() {
    setEditing(null);
    setCreating(true);
    setForm({
      name: "",
      slug: "",
      description: "",
      icon: "",
      category: "content",
      fields: [],
      status: "active",
      sortOrder: 0,
    });
    setError("");
  }

  function openEdit(template: BlockTemplate) {
    setEditing(template);
    setCreating(true);
    setForm({
      name: template.name,
      slug: template.slug,
      description: template.description || "",
      icon: template.icon || "",
      category: template.category,
      fields: template.fields || [],
      status: template.status,
      sortOrder: template.sortOrder,
    });
    setError("");
  }

  function closeForm() {
    setEditing(null);
    setCreating(false);
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      if (editing) {
        await cmsBlockTemplateService.update(editing.id, form);
      } else {
        await cmsBlockTemplateService.create(form);
      }
      await mutate();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this block template?")) return;
    try {
      await cmsBlockTemplateService.delete(id);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const inputClass =
    "w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-sm";

  // Editor form
  if (creating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--theme-text)]">
            {editing ? "Edit Block Template" : "New Block Template"}
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-[var(--theme-border)] px-4 py-1.5 text-sm"
              onClick={closeForm}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? "Saving..." : "Save Template"}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="grid grid-cols-2 gap-4">
          <label>
            <span className="text-sm font-medium text-[var(--theme-text)]">
              Name
            </span>
            <input
              className={inputClass}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Hero Banner"
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
              placeholder="hero-banner"
            />
          </label>
          <label>
            <span className="text-sm font-medium text-[var(--theme-text)]">
              Category
            </span>
            <select
              className={inputClass}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-[var(--theme-text)]">
              Icon (Lucide name)
            </span>
            <input
              className={inputClass}
              value={form.icon}
              onChange={(e) => setForm({ ...form, icon: e.target.value })}
              placeholder="layout-template"
            />
          </label>
          <label className="col-span-2">
            <span className="text-sm font-medium text-[var(--theme-text)]">
              Description
            </span>
            <textarea
              rows={2}
              className={inputClass}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
          <label>
            <span className="text-sm font-medium text-[var(--theme-text)]">
              Sort Order
            </span>
            <input
              type="number"
              className={inputClass}
              value={form.sortOrder}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) })
              }
            />
          </label>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 text-[var(--theme-text)]">
            Fields
          </h2>
          <p className="text-sm text-[var(--theme-muted)] mb-4">
            Define the fields editors will fill in when using this block on a
            page.
          </p>
          <FieldBuilder
            fields={form.fields}
            onChange={(fields) => setForm({ ...form, fields })}
          />
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--theme-text)]">
          Block Templates
        </h1>
        <button
          type="button"
          className="rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
          onClick={openNew}
        >
          New Template
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {templates.length === 0 && (
        <p className="text-sm text-[var(--theme-muted)]">
          No block templates defined. Create templates to use in the page
          builder.
        </p>
      )}

      <div className="space-y-2">
        {templates.map((tpl) => (
          <div
            key={tpl.id}
            className="flex items-center justify-between rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] px-4 py-3"
          >
            <div>
              <p className="font-medium text-[var(--theme-text)]">{tpl.name}</p>
              <p className="text-xs text-[var(--theme-muted)]">
                {tpl.slug} · {tpl.category} · {(tpl.fields || []).length} fields
                · {tpl.status}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="text-sm text-[var(--theme-primary)] hover:underline"
                onClick={() => openEdit(tpl)}
              >
                Edit
              </button>
              <button
                type="button"
                className="text-sm text-red-500 hover:underline"
                onClick={() => handleDelete(tpl.id)}
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
