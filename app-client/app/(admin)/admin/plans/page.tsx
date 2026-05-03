"use client";

import { ResourceManager } from "@/components/admin";
import type { ResourceField, ResourceItem } from "@/types";

const planFields: ResourceField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "price", label: "Price", type: "number" },
  { name: "currency", label: "Currency", type: "text" },
  {
    name: "interval",
    label: "Interval",
    type: "select",
    options: ["month", "year"],
  },
  {
    name: "isActive",
    label: "Active",
    type: "select",
    options: ["true", "false"],
  },
  { name: "sortOrder", label: "Sort Order", type: "number" },
];

const emptyPlan: ResourceItem = {
  name: "",
  slug: "",
  description: "",
  price: 0,
  currency: "USD",
  interval: "month",
  isActive: "true",
  sortOrder: 0,
};

export default function PlansPage() {
  return (
    <ResourceManager
      title="Plans"
      endpoint="/api/plans"
      fields={planFields}
      getTitle={(item) => String(item.name)}
      getSubtitle={(item) => `${item.slug} · $${item.price}/${item.interval}`}
      emptyItem={emptyPlan}
    />
  );
}
