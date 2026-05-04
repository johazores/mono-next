import type { StatCardProps } from "@/types";

export function StatCard({ label, value, detail, icon }: StatCardProps) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-background p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          {detail && <p className="mt-1 text-xs text-muted">{detail}</p>}
        </div>
        {icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}
