"use client";

import { ResourceManager } from "@/components/admin";
import type { ResourceField, ResourceItem } from "@/types";

const taxonomyFields: ResourceField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "pluralName", label: "Plural Name", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: ["active", "inactive"],
  },
  { name: "sortOrder", label: "Sort Order", type: "number" },
];

const emptyTaxonomy: ResourceItem = {
  name: "",
  slug: "",
  pluralName: "",
  description: "",
  status: "active",
  sortOrder: 0,
};

export default function TaxonomiesPage() {
  return (
    <ResourceManager
      title="Taxonomies"
      endpoint="/api/cms/taxonomies"
      fields={taxonomyFields}
      getTitle={(item) => String(item.name)}
      getSubtitle={(item) => `${item.slug} · ${item.status}`}
      emptyItem={emptyTaxonomy}
    />
  );
}
