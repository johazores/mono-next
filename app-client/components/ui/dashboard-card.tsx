import type { DashboardCardProps } from "@/types";

export function DashboardCard({
  title,
  description,
  icon,
  href,
  children,
}: DashboardCardProps) {
  const Wrapper = href ? "a" : "div";
  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={`group rounded-xl border border-border bg-background p-5 transition-all duration-150 ${
        href ? "hover:border-primary/30 hover:shadow-md" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted">{description}</p>
          )}
        </div>
      </div>
      {children && <div className="mt-4">{children}</div>}
    </Wrapper>
  );
}
