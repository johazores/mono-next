import type { StatusBadgeProps, StatusBadgeVariant } from "@/types";

const variantStyles: Record<StatusBadgeVariant, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
  info: "bg-info/10 text-info",
  muted: "bg-surface text-muted",
};

export function StatusBadge({ status, variant = "muted" }: StatusBadgeProps) {
  const style = variantStyles[variant];
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  );
}
