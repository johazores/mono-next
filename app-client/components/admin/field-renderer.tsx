import type { ResourceField } from "@/types";

type FieldRendererProps = {
  field: ResourceField;
  value: unknown;
  onChange: (value: unknown) => void;
};

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
