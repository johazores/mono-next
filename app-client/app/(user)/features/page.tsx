"use client";

import { useFeatures } from "@/hooks/use-features";
import { PageHeader, Notice, EmptyState } from "@/components/ui";

const sourceConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  direct: {
    label: "Subscription",
    bg: "bg-primary/10",
    text: "text-primary",
  },
  inherited: {
    label: "Inherited",
    bg: "bg-warning/10",
    text: "text-warning",
  },
};

function titleCase(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function FeaturesPage() {
  const { features, loading, error } = useFeatures();

  const enabled = features.filter((f) => f.enabled);

  // Group by category from API
  const grouped: Record<string, typeof enabled> = {};
  for (const f of enabled) {
    const cat = f.category || f.key.split(".")[0] || "other";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Features"
        description="Features available to your account based on your subscriptions and products."
      />

      {loading && <p className="text-sm text-muted">Loading&hellip;</p>}
      {error && <Notice message={error} variant="error" />}

      {!loading && enabled.length === 0 && (
        <EmptyState message="No features enabled. Subscribe to a plan or purchase a product to unlock features." />
      )}

      {/* Source legend */}
      {!loading && enabled.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {[sourceConfig.direct, sourceConfig.inherited].map((cfg) => (
            <span
              key={cfg.label}
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {cfg.label}
            </span>
          ))}
        </div>
      )}

      {Object.entries(grouped).map(([category, items]) => (
        <div
          key={category}
          className="overflow-hidden rounded-xl border border-border bg-background"
        >
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {titleCase(category)}
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {items.map((f) => {
              const src = sourceConfig[f.source] ?? sourceConfig.direct;
              return (
                <li
                  key={f.key}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-surface/50"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {f.description || f.key}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{f.key}</p>
                  </div>
                  <span
                    className={`ml-3 shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${src.bg} ${src.text}`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {src.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
