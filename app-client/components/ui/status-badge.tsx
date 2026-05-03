import type { StatusBadgeProps } from "@/types";

const statusStyles: Record<string, string> = {
  active: "bg-green-50 text-green-700",
  disabled: "bg-gray-100 text-gray-600",
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = statusStyles[status] ?? "bg-gray-100 text-gray-600";
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${style}`}
    >
      {label}
    </span>
  );
}
