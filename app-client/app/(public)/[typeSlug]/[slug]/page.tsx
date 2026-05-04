import { notFound } from "next/navigation";
import { mediaUrl } from "@/lib/media-url";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:7001";

type FlatItem = Record<string, unknown> & {
  id: string;
  title: string;
  slug: string;
  status: string;
};

async function getItem(
  typeSlug: string,
  slug: string,
): Promise<FlatItem | null> {
  const res = await fetch(
    `${API_URL}/api/cms/public/content/${typeSlug}/${slug}`,
    { next: { revalidate: 60 } },
  );
  if (!res.ok) return null;
  const json = await res.json();
  // API returns { data: { contentType, item } } where item is already flattened
  return (json.data?.item as FlatItem) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ typeSlug: string; slug: string }>;
}) {
  const { typeSlug, slug } = await params;
  const item = await getItem(typeSlug, slug);
  if (!item) return {};
  return {
    title: String(item.seoTitle || item.title || slug),
    description: String(item.seoDescription || item.excerpt || ""),
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

  const featuredImage = item.featuredImage as string | undefined;
  const body = item.body as string | undefined;
  const excerpt = item.excerpt as string | undefined;
  const author = item.author as string | undefined;
  const publishedAt = item.publishedAt as string | undefined;

  return (
    <main className="max-w-3xl mx-auto py-12 px-6">
      {/* Meta line */}
      {(author || publishedAt) && (
        <p className="mb-4 text-sm text-[var(--theme-muted)]">
          {author && <span>By {author}</span>}
          {author && publishedAt && <span> · </span>}
          {publishedAt && (
            <time dateTime={publishedAt}>
              {new Date(publishedAt).toLocaleDateString(undefined, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </time>
          )}
        </p>
      )}

      <h1 className="text-3xl font-bold mb-4 text-[var(--theme-text)]">
        {item.title}
      </h1>

      {featuredImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(featuredImage)}
          alt={String(item.title)}
          className="w-full rounded-lg mb-6 object-cover max-h-[480px]"
        />
      )}

      {excerpt && (
        <p className="mb-6 text-lg text-[var(--theme-muted)] italic">
          {excerpt}
        </p>
      )}

      {body && (
        <div
          className="prose prose-neutral max-w-none"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      )}
    </main>
  );
}
