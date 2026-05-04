import type { EmptyStateProps } from "@/types";
import { Inbox } from "lucide-react";

export function EmptyState({ message, action }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface/50 px-6 py-12 text-center">
      <Inbox size={32} className="mx-auto text-muted/50" />
      <p className="mt-3 text-sm text-muted">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
