import { notFound } from "next/navigation";
import type { ContentItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7001";

async function getItem(
  typeSlug: string,
  slug: string,
): Promise<ContentItem | null> {
  const res = await fetch(
    `${API_URL}/api/cms/public/content/${typeSlug}/${slug}`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return null;
  const json = await res.json();
  return json.data ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ typeSlug: string; slug: string }>;
}) {
  const { typeSlug, slug } = await params;
  const item = await getItem(typeSlug, slug);
  if (!item) return {};
  const data = (item.data ?? {}) as Record<string, unknown>;
  return {
    title: String(data.seoTitle || item.title || slug),
    description: String(data.seoDescription || data.excerpt || ""),
  };
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ typeSlug: string; slug: string }>;
}) {
  const { typeSlug, slug } = await params;
  const item = await getItem(typeSlug, slug);
  if (!item) notFound();

  const data = (item.data ?? {}) as Record<string, unknown>;

  return (
    <main className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-4 text-[var(--theme-text)]">
        {item.title}
      </h1>
      {typeof data.featuredImage === "string" && (
        <img
          src={data.featuredImage}
          alt={String(item.title)}
          className="w-full rounded-lg mb-6 object-cover"
        />
      )}
      {typeof data.body === "string" && (
        <div
          className="prose prose-neutral max-w-none"
          dangerouslySetInnerHTML={{ __html: data.body }}
        />
      )}
    </main>
  );
}
