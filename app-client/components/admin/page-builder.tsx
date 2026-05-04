"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import { cmsBlockTemplateService } from "@/services/cms-service";
import type {
  BlockTemplate,
  ContentFieldDefinition,
  FlexibleBlock,
} from "@/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PageBuilderProps = {
  value: FlexibleBlock[];
  onChange: (value: FlexibleBlock[]) => void;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function moveItem<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function buildDefaults(template: BlockTemplate): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of template.fields) {
    defaults[field.name] =
      template.defaults?.[field.name] ?? getFieldDefault(field);
  }
  return defaults;
}

function getFieldDefault(field: ContentFieldDefinition): unknown {
  switch (field.type) {
    case "boolean":
      return false;
    case "number":
      return 0;
    case "repeater":
    case "gallery-list":
    case "document-list":
    case "array-text":
      return [];
    default:
      return "";
  }
}

async function fetchTemplates() {
  const result = await cmsBlockTemplateService.list();
  return result.data?.items ?? [];
}

// ---------------------------------------------------------------------------
// Repeater editor — handles repeater sub-fields
// ---------------------------------------------------------------------------

function RepeaterEditor({
  subFields,
  value,
  onChange,
}: {
  subFields: ContentFieldDefinition[];
  value: Record<string, unknown>[];
  onChange: (value: Record<string, unknown>[]) => void;
}) {
  const items = Array.isArray(value) ? value : [];

  function addItem() {
    const empty: Record<string, unknown> = {};
    for (const sf of subFields) empty[sf.name] = getFieldDefault(sf);
    onChange([...items, empty]);
  }

  function updateItem(index: number, name: string, val: unknown) {
    onChange(
      items.map((item, i) => (i === index ? { ...item, [name]: val } : item)),
    );
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const inputClass =
    "w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-sm";

  return (
    <div className="col-span-2 space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="border border-[var(--theme-border)] rounded-lg p-3"
        >
          <div className="flex items-center justify-between mb-2">
            <strong className="text-xs text-[var(--theme-text)]">
              Item {index + 1}
            </strong>
            <div className="flex gap-1 text-xs">
              {index > 0 && (
                <button
                  type="button"
                  className="text-[var(--theme-muted)] hover:text-[var(--theme-text)]"
                  onClick={() => onChange(moveItem(items, index, index - 1))}
                >
                  Up
                </button>
              )}
              {index < items.length - 1 && (
                <button
                  type="button"
                  className="text-[var(--theme-muted)] hover:text-[var(--theme-text)]"
                  onClick={() => onChange(moveItem(items, index, index + 1))}
                >
                  Down
                </button>
              )}
              <button
                type="button"
                className="text-red-500 hover:text-red-700"
                onClick={() => removeItem(index)}
              >
                Remove
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {subFields.map((sf) => (
              <label
                key={sf.name}
                className={
                  sf.width === "full" ||
                  sf.type === "textarea" ||
                  sf.type === "rich-text"
                    ? "col-span-2"
                    : ""
                }
              >
                <span className="text-xs text-[var(--theme-muted)]">
                  {sf.label}
                </span>
                {sf.type === "textarea" || sf.type === "rich-text" ? (
                  <textarea
                    rows={2}
                    className={inputClass}
                    value={String(item[sf.name] ?? "")}
                    onChange={(e) => updateItem(index, sf.name, e.target.value)}
                  />
                ) : (
                  <input
                    className={inputClass}
                    type={sf.type === "number" ? "number" : "text"}
                    value={String(item[sf.name] ?? "")}
                    onChange={(e) =>
                      updateItem(
                        index,
                        sf.name,
                        sf.type === "number"
                          ? Number(e.target.value)
                          : e.target.value,
                      )
                    }
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="text-xs text-[var(--theme-primary)] hover:underline"
        onClick={addItem}
      >
        + Add Item
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dynamic field input — renders a field based on its definition
// ---------------------------------------------------------------------------

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: ContentFieldDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const inputClass =
    "w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-sm";

  if (field.type === "repeater" && field.subFields?.length) {
    return (
      <RepeaterEditor
        subFields={field.subFields}
        value={Array.isArray(value) ? value : []}
        onChange={onChange}
      />
    );
  }

  if (field.type === "textarea" || field.type === "rich-text") {
    return (
      <textarea
        rows={field.type === "rich-text" ? 6 : 3}
        className={inputClass}
        placeholder={field.placeholder}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        className={inputClass}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Select...</option>
        {(field.options || []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "boolean") {
    return (
      <label className="flex items-center gap-2 mt-1">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="text-sm text-[var(--theme-text)]">{field.label}</span>
      </label>
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        className={inputClass}
        placeholder={field.placeholder}
        value={String(value ?? "")}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    );
  }

  // text, url, media, date, and everything else → text input
  return (
    <input
      type={field.type === "date" ? "date" : "text"}
      className={inputClass}
      placeholder={field.placeholder}
      value={String(value ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

// ---------------------------------------------------------------------------
// Page builder (template-driven — ACF Flexible Content style)
// ---------------------------------------------------------------------------

export function PageBuilder({ value, onChange }: PageBuilderProps) {
  const blocks = useMemo(() => (Array.isArray(value) ? value : []), [value]);
  const { data: templates = [] } = useSWR<BlockTemplate[]>(
    "/api/cms/block-templates",
    fetchTemplates,
  );
  const [selectedSlug, setSelectedSlug] = useState("");
  const [openBlocks, setOpenBlocks] = useState<Record<number, boolean>>({});

  const templateMap = useMemo(() => {
    const map = new Map<string, BlockTemplate>();
    for (const t of templates) map.set(t.slug, t);
    return map;
  }, [templates]);

  // Group templates by category for the dropdown
  const grouped = useMemo(() => {
    const cats = new Map<string, BlockTemplate[]>();
    for (const t of templates) {
      if (t.status !== "active") continue;
      const list = cats.get(t.category) || [];
      list.push(t);
      cats.set(t.category, list);
    }
    return cats;
  }, [templates]);

  function addBlock() {
    const slug = selectedSlug || templates[0]?.slug;
    if (!slug) return;
    const template = templateMap.get(slug);
    if (!template) return;
    onChange([
      ...blocks,
      { templateSlug: slug, data: buildDefaults(template) },
    ]);
  }

  function setBlockData(index: number, fieldName: string, fieldValue: unknown) {
    onChange(
      blocks.map((block, i) =>
        i === index
          ? { ...block, data: { ...block.data, [fieldName]: fieldValue } }
          : block,
      ),
    );
  }

  function removeBlock(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function duplicateBlock(index: number) {
    const copy = JSON.parse(JSON.stringify(blocks[index]));
    onChange([...blocks.slice(0, index + 1), copy, ...blocks.slice(index + 1)]);
  }

  function moveBlock(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= blocks.length) return;
    onChange(moveItem(blocks, index, next));
  }

  const inputClass =
    "w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-sm";

  return (
    <div className="space-y-4">
      {/* Add block selector */}
      <div className="flex gap-2">
        <select
          className={inputClass + " max-w-xs"}
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
        >
          {templates.length === 0 && (
            <option value="">No templates available</option>
          )}
          {[...grouped.entries()].map(([category, tpls]) => (
            <optgroup
              key={category}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
            >
              {tpls.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <button
          type="button"
          className="rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          disabled={templates.length === 0}
          onClick={addBlock}
        >
          Add Section
        </button>
      </div>

      {templates.length === 0 && (
        <p className="text-sm text-[var(--theme-muted)]">
          No block templates found. Create templates in{" "}
          <a
            href="/admin/block-templates"
            className="text-[var(--theme-primary)] underline"
          >
            Block Templates
          </a>{" "}
          first.
        </p>
      )}

      {blocks.length === 0 && templates.length > 0 && (
        <p className="text-sm text-[var(--theme-muted)]">
          No sections yet. Pick a template and click &ldquo;Add Section&rdquo;.
        </p>
      )}

      {/* Block list */}
      {blocks.map((block, index) => {
        const template = templateMap.get(block.templateSlug);
        const isOpen = openBlocks[index] ?? index === 0;
        const templateName = template?.name || block.templateSlug;

        return (
          <div
            key={`${block.templateSlug}-${index}`}
            className="rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)]"
          >
            {/* Collapsible header */}
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-left"
              onClick={() => setOpenBlocks((c) => ({ ...c, [index]: !isOpen }))}
            >
              <span className="text-sm font-semibold text-[var(--theme-text)]">
                {index + 1}. {templateName}
              </span>
              <span className="text-xs text-[var(--theme-muted)]">
                {isOpen ? "Collapse" : "Edit"}
              </span>
            </button>

            {isOpen && (
              <div className="border-t border-[var(--theme-border)] px-4 py-3 space-y-3">
                {/* Block actions */}
                <div className="flex gap-2 text-xs">
                  <button
                    type="button"
                    className="text-[var(--theme-muted)] hover:text-[var(--theme-text)]"
                    onClick={() => moveBlock(index, -1)}
                  >
                    Move Up
                  </button>
                  <button
                    type="button"
                    className="text-[var(--theme-muted)] hover:text-[var(--theme-text)]"
                    onClick={() => moveBlock(index, 1)}
                  >
                    Move Down
                  </button>
                  <button
                    type="button"
                    className="text-[var(--theme-muted)] hover:text-[var(--theme-text)]"
                    onClick={() => duplicateBlock(index)}
                  >
                    Duplicate
                  </button>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => removeBlock(index)}
                  >
                    Remove
                  </button>
                </div>

                {/* Dynamic fields from template definition */}
                {!template && (
                  <p className="text-sm text-red-500">
                    Template &ldquo;{block.templateSlug}&rdquo; not found.
                  </p>
                )}
                <div className="grid grid-cols-2 gap-3">
                  {(template?.fields || []).map((field) => {
                    const isFullWidth =
                      field.width === "full" ||
                      field.type === "textarea" ||
                      field.type === "rich-text" ||
                      field.type === "repeater" ||
                      field.type === "boolean";

                    return (
                      <label
                        key={field.name}
                        className={isFullWidth ? "col-span-2" : ""}
                      >
                        {field.type !== "boolean" && (
                          <span className="text-xs text-[var(--theme-muted)]">
                            {field.label}
                            {field.required && (
                              <span className="text-red-500 ml-0.5">*</span>
                            )}
                          </span>
                        )}
                        <FieldInput
                          field={field}
                          value={block.data[field.name]}
                          onChange={(val) =>
                            setBlockData(index, field.name, val)
                          }
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
