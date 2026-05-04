"use client";

import { ResourceManager } from "@/components/admin";
import type { ResourceField, ResourceItem } from "@/types";

const taxonomyFields: ResourceField[] = [
  { name: "name", label: "Name", type: "text" },
  {
    name: "slug",
    label: "Slug",
    type: "slug",
    slugSource: "name",
    help: "URL-friendly identifier.",
  },
  { name: "pluralName", label: "Plural Name", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "hierarchical",
    label: "Hierarchical",
    type: "select",
    options: ["false", "true"],
    optionLabels: { false: "Flat (tags)", true: "Hierarchical (categories)" },
    help: "Allow nested terms (parent/child).",
  },
  {
    name: "contentTypes",
    label: "Content Types",
    type: "checkboxes",
    optionsEndpoint: "/api/cms/content-types",
    optionsMapping: { keyField: "slug", labelField: "name" },
    help: "Select which content types this taxonomy applies to.",
    section: "Details",
  },
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
  hierarchical: "false",
  contentTypes: [],
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
