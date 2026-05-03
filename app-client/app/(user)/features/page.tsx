"use client";

import { useFeatures } from "@/hooks/use-features";

const sourceConfig: Record<
  string,
  { label: string; bg: string; text: string }
> = {
  direct: {
    label: "Subscription",
    bg: "bg-blue-50",
    text: "text-blue-700",
  },
  inherited: {
    label: "Inherited",
    bg: "bg-amber-50",
    text: "text-amber-700",
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Features</h1>
        <p className="mt-1 text-sm text-gray-600">
          Features available to your account based on your subscriptions and
          products.
        </p>
      </div>

      {loading && <p className="text-sm text-gray-400">Loading&hellip;</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && enabled.length === 0 && (
        <p className="text-sm text-gray-500">
          No features enabled. Subscribe to a plan or purchase a product to
          unlock features.
        </p>
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
          className="rounded-lg border border-gray-200 bg-white"
        >
          <div className="border-b border-gray-100 px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              {titleCase(category)}
            </h2>
          </div>
          <ul className="divide-y divide-gray-50">
            {items.map((f) => {
              const src = sourceConfig[f.source] ?? sourceConfig.direct;
              return (
                <li
                  key={f.key}
                  className="flex items-center justify-between px-5 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {f.description || f.key}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">{f.key}</p>
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
