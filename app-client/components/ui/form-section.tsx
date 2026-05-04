import type { FormSectionProps } from "@/types";

export function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-background p-6">
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}
