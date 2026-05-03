import { useCallback, useEffect, useState } from "react";
import { resourceService } from "@/services/resource-service";
import type { ResourceField, FieldRendererProps, DynamicOption } from "@/types";

function formatDateInput(value: unknown) {
  if (!value) return "";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none";

export function FieldRenderer({ field, value, onChange }: FieldRendererProps) {
  const displayValue = value == null ? "" : String(value);
  const wrapperClass = field.fullWidth ? "col-span-2" : "";

  if (field.type === "checkboxes") {
    return (
      <CheckboxesField
        field={field}
        value={value}
        onChange={onChange}
        wrapperClass={wrapperClass}
      />
    );
  }

  if (field.type === "textarea") {
    return (
      <label className={`grid gap-1.5 ${wrapperClass || "col-span-2"}`}>
        <span className="text-sm font-medium text-gray-700">{field.label}</span>
        <textarea
          className={`${inputClass} resize-y`}
          value={displayValue}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
        />
        {field.help && (
          <span className="text-xs text-gray-500">{field.help}</span>
        )}
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <label className={`grid gap-1.5 ${wrapperClass}`}>
        <span className="text-sm font-medium text-gray-700">{field.label}</span>
        <select
          className={inputClass}
          value={displayValue}
          onChange={(e) => onChange(e.target.value)}
        >
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {field.optionLabels?.[option] ??
                option.charAt(0).toUpperCase() + option.slice(1)}
            </option>
          ))}
        </select>
        {field.help && (
          <span className="text-xs text-gray-500">{field.help}</span>
        )}
      </label>
    );
  }

  return (
    <label className={`grid gap-1.5 ${wrapperClass}`}>
      <span className="text-sm font-medium text-gray-700">{field.label}</span>
      <input
        type={field.type}
        className={inputClass}
        value={field.type === "date" ? formatDateInput(value) : displayValue}
        onChange={(e) =>
          onChange(
            field.type === "number" ? Number(e.target.value) : e.target.value,
          )
        }
      />
      {field.help && (
        <span className="text-xs text-gray-500">{field.help}</span>
      )}
    </label>
  );
}

// --- Checkboxes sub-component ---

function CheckboxesField({
  field,
  value,
  onChange,
  wrapperClass,
}: {
  field: ResourceField;
  value: unknown;
  onChange: (value: unknown) => void;
  wrapperClass: string;
}) {
  const [options, setOptions] = useState<DynamicOption[]>([]);
  const [loadingOpts, setLoadingOpts] = useState(false);

  // Parse current value to a Set of selected keys
  const selected = (() => {
    if (Array.isArray(value)) return new Set(value as string[]);
    if (typeof value === "string" && value.trim()) {
      return new Set(
        value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      );
    }
    return new Set<string>();
  })();

  const loadOptions = useCallback(async () => {
    if (!field.optionsEndpoint) {
      // Fall back to static options
      setOptions(
        (field.options ?? []).map((o) => ({
          key: o,
          description: field.optionLabels?.[o] ?? o,
          category: "",
        })),
      );
      return;
    }
    setLoadingOpts(true);
    try {
      const items = await resourceService.fetchOptions<DynamicOption>(
        field.optionsEndpoint,
      );
      setOptions(items);
    } catch {
      // Silently fall back to empty
    } finally {
      setLoadingOpts(false);
    }
  }, [field.optionsEndpoint, field.options, field.optionLabels]);

  useEffect(() => {
    loadOptions();
  }, [loadOptions]);

  function toggle(key: string) {
    const next = new Set(selected);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    onChange(Array.from(next));
  }

  // Group by category
  const grouped: Record<string, DynamicOption[]> = {};
  for (const opt of options) {
    const cat = opt.category || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(opt);
  }

  return (
    <div className={`grid gap-1.5 ${wrapperClass || "col-span-2"}`}>
      <span className="text-sm font-medium text-gray-700">{field.label}</span>
      {field.help && (
        <span className="text-xs text-gray-500">{field.help}</span>
      )}
      {loadingOpts && (
        <span className="text-xs text-gray-400">Loading&hellip;</span>
      )}
      <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat}>
            {Object.keys(grouped).length > 1 && (
              <div className="sticky top-0 bg-gray-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">
                {cat}
              </div>
            )}
            {items.map((opt) => (
              <label
                key={opt.key}
                className="flex cursor-pointer items-center gap-2.5 px-3 py-2 hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.has(opt.key)}
                  onChange={() => toggle(opt.key)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="min-w-0 text-sm text-gray-800">
                  {opt.description || opt.key}
                </span>
                <span className="ml-auto shrink-0 text-xs text-gray-400">
                  {opt.key}
                </span>
              </label>
            ))}
          </div>
        ))}
        {!loadingOpts && options.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400">
            No features available.
          </p>
        )}
      </div>
      {selected.size > 0 && (
        <p className="text-xs text-gray-500">
          {selected.size} selected: {Array.from(selected).join(", ")}
        </p>
      )}
    </div>
  );
}
