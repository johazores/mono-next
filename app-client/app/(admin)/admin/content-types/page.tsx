"use client";

import { ResourceManager } from "@/components/admin";
import type { ResourceField, ResourceItem } from "@/types";

const contentTypeFields: ResourceField[] = [
  { name: "name", label: "Name", type: "text" },
  {
    name: "slug",
    label: "Slug",
    type: "text",
    help: "URL-friendly identifier (e.g. services, blog-posts).",
  },
  { name: "pluralName", label: "Plural Name", type: "text" },
  {
    name: "icon",
    label: "Icon",
    type: "text",
    help: "Lucide icon name (optional).",
  },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: ["active", "inactive"],
  },
  { name: "sortOrder", label: "Sort Order", type: "number" },
];

const emptyContentType: ResourceItem = {
  name: "",
  slug: "",
  pluralName: "",
  icon: "",
  description: "",
  status: "active",
  sortOrder: 0,
};

export default function ContentTypesPage() {
  return (
    <ResourceManager
      title="Content Types"
      endpoint="/api/cms/content-types"
      fields={contentTypeFields}
      getTitle={(item) => String(item.name)}
      getSubtitle={(item) => `/${item.slug} · ${item.status}`}
      emptyItem={emptyContentType}
    />
  );
}
