import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/repositories/content-item-repository", () => ({
  contentItemRepository: {
    listByType: vi.fn(),
    listPublishedByType: vi.fn(),
    findById: vi.fn(),
    findBySlug: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/repositories/content-type-repository", () => ({
  contentTypeRepository: {
    findBySlug: vi.fn(),
  },
}));

import { contentItemService } from "@/services/content-item-service";
import { contentItemRepository } from "@/repositories/content-item-repository";
import { contentTypeRepository } from "@/repositories/content-type-repository";

const itemRepo = vi.mocked(contentItemRepository);
const typeRepo = vi.mocked(contentTypeRepository);

const now = new Date();

function fakeContentType(overrides = {}) {
  return {
    id: "ct-1",
    name: "Blog Post",
    slug: "blog-posts",
    pluralName: "Blog Posts",
    icon: null,
    description: null,
    fields: [],
    settings: {
      hasSlug: true,
      hasStatus: true,
      slugSource: "name",
      defaultStatus: "draft",
    },
    listDisplay: { titleField: "name" },
    publicSettings: { hasPublicList: false, hasDetailPage: false },
    status: "active",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function fakeItem(overrides = {}) {
  return {
    id: "item-1",
    contentTypeId: "ct-1",
    contentTypeSlug: "blog-posts",
    slug: "test-item",
    title: "Test Item",
    data: {},
    status: "draft",
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("contentItemService.create", () => {
  it("throws if content type not found", async () => {
    typeRepo.findBySlug.mockResolvedValue(null);
    await expect(
      contentItemService.create("missing", { title: "Test" }),
    ).rejects.toThrow('Content type "missing" not found.');
  });

  it("creates item with standard fields persisted in data", async () => {
    const ct = fakeContentType();
    typeRepo.findBySlug.mockResolvedValue(ct as never);
    itemRepo.create.mockResolvedValue(fakeItem() as never);

    await contentItemService.create("blog-posts", {
      title: "My Post",
      slug: "my-post",
      status: "published",
      body: "Hello world",
      excerpt: "A short summary",
      featuredImage: "https://example.com/img.jpg",
      author: "Jane",
      publishedAt: "2024-01-01T00:00:00",
      visibility: "public",
      allowComments: "true",
      format: "standard",
      template: "",
    });

    expect(itemRepo.create).toHaveBeenCalledOnce();
    const createArg = itemRepo.create.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(createArg.contentTypeSlug).toBe("blog-posts");
    expect(createArg.slug).toBe("my-post");
    expect(createArg.status).toBe("published");

    // Standard fields in data
    const data = createArg.data as Record<string, unknown>;
    expect(data.body).toBe("Hello world");
    expect(data.excerpt).toBe("A short summary");
    expect(data.featuredImage).toBe("https://example.com/img.jpg");
    expect(data.author).toBe("Jane");
    expect(data.publishedAt).toBe("2024-01-01T00:00:00");
    expect(data.visibility).toBe("public");
    expect(data.allowComments).toBe(true); // coerced from string "true"
    expect(data.format).toBe("standard");
    expect(data.template).toBeNull(); // empty string → null
  });

  it("coerces allowComments boolean correctly", async () => {
    const ct = fakeContentType();
    typeRepo.findBySlug.mockResolvedValue(ct as never);
    itemRepo.create.mockResolvedValue(fakeItem() as never);

    await contentItemService.create("blog-posts", {
      title: "Test",
      allowComments: "false",
    });

    const data = (itemRepo.create.mock.calls[0][0] as Record<string, unknown>)
      .data as Record<string, unknown>;
    expect(data.allowComments).toBe(false);
  });

  it("sets null for missing standard fields", async () => {
    const ct = fakeContentType();
    typeRepo.findBySlug.mockResolvedValue(ct as never);
    itemRepo.create.mockResolvedValue(fakeItem() as never);

    await contentItemService.create("blog-posts", { title: "Minimal" });

    const data = (itemRepo.create.mock.calls[0][0] as Record<string, unknown>)
      .data as Record<string, unknown>;
    expect(data.body).toBeNull();
    expect(data.excerpt).toBeNull();
    expect(data.featuredImage).toBeNull();
    expect(data.author).toBeNull();
  });

  it("includes custom fields alongside standard fields", async () => {
    const ct = fakeContentType({
      fields: [
        { name: "category", label: "Category", type: "text" },
        { name: "tags", label: "Tags", type: "text" },
      ],
    });
    typeRepo.findBySlug.mockResolvedValue(ct as never);
    itemRepo.create.mockResolvedValue(fakeItem() as never);

    await contentItemService.create("blog-posts", {
      title: "Post",
      body: "Content here",
      category: "news",
      tags: "a,b",
    });

    const data = (itemRepo.create.mock.calls[0][0] as Record<string, unknown>)
      .data as Record<string, unknown>;
    expect(data.body).toBe("Content here");
    expect(data.category).toBe("news");
    expect(data.tags).toBe("a,b");
  });

  it("does not overwrite standard field with custom field definition", async () => {
    // If a content type has "body" as a custom field too, standard wins
    const ct = fakeContentType({
      fields: [{ name: "body", label: "Body", type: "rich-text" }],
    });
    typeRepo.findBySlug.mockResolvedValue(ct as never);
    itemRepo.create.mockResolvedValue(fakeItem() as never);

    await contentItemService.create("blog-posts", {
      title: "Post",
      body: "Standard body text",
    });

    const data = (itemRepo.create.mock.calls[0][0] as Record<string, unknown>)
      .data as Record<string, unknown>;
    expect(data.body).toBe("Standard body text");
  });

  it("generates slug from name when no slug provided", async () => {
    const ct = fakeContentType();
    typeRepo.findBySlug.mockResolvedValue(ct as never);
    itemRepo.create.mockResolvedValue(fakeItem() as never);

    await contentItemService.create("blog-posts", {
      name: "My Great Post!",
    });

    const createArg = itemRepo.create.mock.calls[0][0] as Record<
      string,
      unknown
    >;
    expect(createArg.slug).toBe("my-great-post");
  });
});

describe("contentItemService.update", () => {
  it("throws if content type not found", async () => {
    typeRepo.findBySlug.mockResolvedValue(null);
    await expect(
      contentItemService.update("item-1", "missing", { title: "Test" }),
    ).rejects.toThrow('Content type "missing" not found.');
  });

  it("persists standard fields on update", async () => {
    const ct = fakeContentType();
    typeRepo.findBySlug.mockResolvedValue(ct as never);
    itemRepo.update.mockResolvedValue(fakeItem() as never);

    await contentItemService.update("item-1", "blog-posts", {
      title: "Updated",
      body: "Updated body",
      author: "Updated Author",
      allowComments: true,
    });

    expect(itemRepo.update).toHaveBeenCalledOnce();
    const [id, payload] = itemRepo.update.mock.calls[0] as [
      string,
      Record<string, unknown>,
    ];
    expect(id).toBe("item-1");

    const data = payload.data as Record<string, unknown>;
    expect(data.body).toBe("Updated body");
    expect(data.author).toBe("Updated Author");
    expect(data.allowComments).toBe(true);
  });
});

describe("contentItemService.delete", () => {
  it("delegates to repository", async () => {
    itemRepo.delete.mockResolvedValue(fakeItem() as never);
    await contentItemService.delete("item-1");
    expect(itemRepo.delete).toHaveBeenCalledWith("item-1");
  });
});

describe("contentItemService read operations", () => {
  it("listByType delegates to repository", async () => {
    itemRepo.listByType.mockResolvedValue([]);
    const result = await contentItemService.listByType("blog-posts");
    expect(itemRepo.listByType).toHaveBeenCalledWith("blog-posts");
    expect(result).toEqual([]);
  });

  it("getById delegates to repository", async () => {
    const item = fakeItem();
    itemRepo.findById.mockResolvedValue(item as never);
    const result = await contentItemService.getById("item-1");
    expect(itemRepo.findById).toHaveBeenCalledWith("item-1");
    expect(result).toEqual(item);
  });

  it("getBySlug delegates to repository", async () => {
    const item = fakeItem();
    itemRepo.findBySlug.mockResolvedValue(item as never);
    const result = await contentItemService.getBySlug("blog-posts", "my-slug");
    expect(itemRepo.findBySlug).toHaveBeenCalledWith("blog-posts", "my-slug");
    expect(result).toEqual(item);
  });
});
