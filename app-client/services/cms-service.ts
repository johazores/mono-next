import { apiGet, apiPost, apiPut, apiRequest } from "@/services/api-client";
import type {
  CmsPage,
  ContentType,
  ContentItem,
  Taxonomy,
  TaxonomyTerm,
  MediaItem,
  BlockTemplate,
} from "@/types";

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

export const cmsPageService = {
  list() {
    return apiGet<{ items: CmsPage[] }>("/api/cms/pages");
  },
  getById(id: string) {
    return apiGet<CmsPage>(`/api/cms/pages/${id}`);
  },
  create(data: Partial<CmsPage>) {
    return apiPost<CmsPage>("/api/cms/pages", data);
  },
  update(id: string, data: Partial<CmsPage>) {
    return apiPut<CmsPage>(`/api/cms/pages/${id}`, data);
  },
  delete(id: string) {
    return apiRequest(`/api/cms/pages/${id}`, { method: "DELETE" });
  },
};

// ---------------------------------------------------------------------------
// Content Types
// ---------------------------------------------------------------------------

export const cmsContentTypeService = {
  list() {
    return apiGet<{ items: ContentType[] }>("/api/cms/content-types");
  },
  getById(id: string) {
    return apiGet<ContentType>(`/api/cms/content-types/${id}`);
  },
  create(data: Partial<ContentType>) {
    return apiPost<ContentType>("/api/cms/content-types", data);
  },
  update(id: string, data: Partial<ContentType>) {
    return apiPut<ContentType>(`/api/cms/content-types/${id}`, data);
  },
  delete(id: string) {
    return apiRequest(`/api/cms/content-types/${id}`, { method: "DELETE" });
  },
};

// ---------------------------------------------------------------------------
// Content Items
// ---------------------------------------------------------------------------

export const cmsContentService = {
  list(typeSlug: string) {
    return apiGet<{ items: ContentItem[] }>(`/api/cms/content/${typeSlug}`);
  },
  getById(typeSlug: string, id: string) {
    return apiGet<ContentItem>(`/api/cms/content/${typeSlug}/${id}`);
  },
  create(typeSlug: string, data: Record<string, unknown>) {
    return apiPost<ContentItem>(`/api/cms/content/${typeSlug}`, data);
  },
  update(typeSlug: string, id: string, data: Record<string, unknown>) {
    return apiPut<ContentItem>(`/api/cms/content/${typeSlug}/${id}`, data);
  },
  delete(typeSlug: string, id: string) {
    return apiRequest(`/api/cms/content/${typeSlug}/${id}`, {
      method: "DELETE",
    });
  },
};

// ---------------------------------------------------------------------------
// Taxonomies
// ---------------------------------------------------------------------------

export const cmsTaxonomyService = {
  list() {
    return apiGet<{ items: Taxonomy[] }>("/api/cms/taxonomies");
  },
  getById(id: string) {
    return apiGet<Taxonomy>(`/api/cms/taxonomies/${id}`);
  },
  create(data: Partial<Taxonomy>) {
    return apiPost<Taxonomy>("/api/cms/taxonomies", data);
  },
  update(id: string, data: Partial<Taxonomy>) {
    return apiPut<Taxonomy>(`/api/cms/taxonomies/${id}`, data);
  },
  delete(id: string) {
    return apiRequest(`/api/cms/taxonomies/${id}`, { method: "DELETE" });
  },
  listTerms(taxonomyId: string) {
    return apiGet<{ items: TaxonomyTerm[] }>(
      `/api/cms/taxonomies/${taxonomyId}/terms`,
    );
  },
  createTerm(taxonomyId: string, data: Partial<TaxonomyTerm>) {
    return apiPost<TaxonomyTerm>(
      `/api/cms/taxonomies/${taxonomyId}/terms`,
      data,
    );
  },
  updateTerm(taxonomyId: string, termId: string, data: Partial<TaxonomyTerm>) {
    return apiPut<TaxonomyTerm>(
      `/api/cms/taxonomies/${taxonomyId}/terms/${termId}`,
      data,
    );
  },
  deleteTerm(taxonomyId: string, termId: string) {
    return apiRequest(`/api/cms/taxonomies/${taxonomyId}/terms/${termId}`, {
      method: "DELETE",
    });
  },
};

// ---------------------------------------------------------------------------
// Media
// ---------------------------------------------------------------------------

export const cmsMediaService = {
  list() {
    return apiGet<{ items: MediaItem[] }>("/api/cms/media");
  },
  getById(id: string) {
    return apiGet<MediaItem>(`/api/cms/media/${id}`);
  },
  create(data: Partial<MediaItem> & { base64Data?: string }) {
    return apiPost<MediaItem>("/api/cms/media", data);
  },
  delete(id: string) {
    return apiRequest(`/api/cms/media/${id}`, { method: "DELETE" });
  },
};

// ---------------------------------------------------------------------------
// Block Templates
// ---------------------------------------------------------------------------

export const cmsBlockTemplateService = {
  list() {
    return apiGet<{ items: BlockTemplate[] }>("/api/cms/block-templates");
  },
  getById(id: string) {
    return apiGet<BlockTemplate>(`/api/cms/block-templates/${id}`);
  },
  create(data: Partial<BlockTemplate>) {
    return apiPost<BlockTemplate>("/api/cms/block-templates", data);
  },
  update(id: string, data: Partial<BlockTemplate>) {
    return apiPut<BlockTemplate>(`/api/cms/block-templates/${id}`, data);
  },
  delete(id: string) {
    return apiRequest(`/api/cms/block-templates/${id}`, { method: "DELETE" });
  },
};
