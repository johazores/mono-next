import Link from "next/link";
import type { ContentItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7001";

async function getItems(typeSlug: string): Promise<ContentItem[]> {
  const res = await fetch(`${API_URL}/api/cms/public/content/${typeSlug}`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data?.items ?? [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ typeSlug: string }>;
}) {
  const { typeSlug } = await params;
  return {
    title: typeSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
  };
}

export default async function ContentListPage({
  params,
}: {
  params: Promise<{ typeSlug: string }>;
}) {
  const { typeSlug } = await params;
  const items = await getItems(typeSlug);

  const heading = typeSlug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <main className="max-w-4xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8 text-[var(--theme-text)]">
        {heading}
      </h1>
      {items.length === 0 && (
        <p className="text-[var(--theme-muted)]">No content published yet.</p>
      )}
      <div className="space-y-4">
        {items.map((item) => {
          const data = (item.data ?? {}) as Record<string, unknown>;
          return (
            <Link
              key={item.id}
              href={`/${typeSlug}/${item.slug}`}
              className="block rounded-lg border border-[var(--theme-border)] bg-[var(--theme-surface)] p-6 hover:border-[var(--theme-primary)] transition-colors"
            >
              <h2 className="text-xl font-semibold text-[var(--theme-text)]">
                {item.title}
              </h2>
              {typeof data.excerpt === "string" && (
                <p className="mt-1 text-[var(--theme-muted)]">{data.excerpt}</p>
              )}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
