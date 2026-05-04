import type { NoticeProps } from "@/types";
import { CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const variantConfig: Record<string, { styles: string; Icon: LucideIcon }> = {
  success: {
    styles: "border-success/20 bg-success/10 text-success",
    Icon: CheckCircle,
  },
  error: { styles: "border-error/20 bg-error/10 text-error", Icon: XCircle },
  info: { styles: "border-info/20 bg-info/10 text-info", Icon: Info },
  warning: {
    styles: "border-warning/20 bg-warning/10 text-warning",
    Icon: AlertTriangle,
  },
};

export function Notice({ message, variant = "success" }: NoticeProps) {
  const { styles, Icon } = variantConfig[variant] ?? variantConfig.info;

  return (
    <div
      className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm ${styles}`}
      role="alert"
    >
      <Icon size={16} className="shrink-0" />
      {message}
    </div>
  );
}
