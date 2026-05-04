import { contentItemService } from "@/services/content-item-service";
import { contentTypeRepository } from "@/repositories/content-type-repository";
import { taxonomyRepository } from "@/repositories/taxonomy-repository";

function flatten(item: Record<string, unknown>): Record<string, unknown> {
  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    ...((item.data as Record<string, unknown>) || {}),
    status: item.status,
    sortOrder: item.sortOrder,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

export const publicContentService = {
  async listPublished(typeSlug: string) {
    const items = await contentItemService.listPublishedByType(typeSlug);
    return items.map(flatten);
  },

  async getPublished(typeSlug: string, slug: string) {
    const item = await contentItemService.getBySlug(typeSlug, slug);
    if (!item || (item as Record<string, unknown>).status !== "published")
      return null;
    return flatten(item as Record<string, unknown>);
  },

  async getContentTypeDefinition(typeSlug: string) {
    return contentTypeRepository.findBySlug(typeSlug);
  },

  async listPublishedGrouped(
    typeSlug: string,
    taxonomySlug: string,
    categoryFieldName: string,
  ) {
    const [items, taxonomy] = await Promise.all([
      this.listPublished(typeSlug),
      taxonomyRepository.findBySlug(taxonomySlug),
    ]);

    if (!taxonomy) return { groups: [], ungrouped: items };

    const terms =
      ((taxonomy as Record<string, unknown>).terms as Array<
        Record<string, unknown>
      >) || [];
    const groups = terms.map((term) => ({
      id: term.id,
      name: term.name,
      slug: term.slug,
      description: term.description,
      imageUrl: term.imageUrl,
      items: items.filter((item) => item[categoryFieldName] === term.name),
    }));

    const groupedSlugs = new Set(
      groups.flatMap((g) => g.items.map((i) => i.slug as string)),
    );
    const ungrouped = items.filter(
      (item) => !groupedSlugs.has(item.slug as string),
    );

    return { groups, ungrouped };
  },
};
