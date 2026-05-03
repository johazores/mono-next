"use client";

import { ResourceManager } from "@/components/admin";
import type { ResourceField, ResourceItem } from "@/types";

const productFields: ResourceField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  {
    name: "type",
    label: "Type",
    type: "select",
    options: ["physical", "digital", "membership"],
  },
  { name: "price", label: "Price", type: "number" },
  { name: "currency", label: "Currency", type: "text" },
  {
    name: "paymentModel",
    label: "Payment Model",
    type: "select",
    options: ["one-time", "recurring"],
  },
  {
    name: "interval",
    label: "Billing Interval",
    type: "select",
    options: ["month", "year"],
    help: "For recurring products only.",
  },
  {
    name: "maxSubUsers",
    label: "Max Sub-Users",
    type: "number",
    help: "0 = none, -1 = unlimited.",
  },
  {
    name: "fileUrl",
    label: "File URL",
    type: "text",
    help: "For digital products: download link.",
  },
  {
    name: "accessKeys",
    label: "Access Keys",
    type: "checkboxes",
    optionsEndpoint: "/api/admins/features",
    help: "Select the features granted when a user purchases this product.",
  },
  {
    name: "isActive",
    label: "Active",
    type: "select",
    options: ["true", "false"],
  },
  { name: "sortOrder", label: "Sort Order", type: "number" },
];

const emptyProduct: ResourceItem = {
  name: "",
  slug: "",
  description: "",
  type: "digital",
  price: 0,
  currency: "USD",
  paymentModel: "one-time",
  interval: "month",
  maxSubUsers: 0,
  fileUrl: "",
  accessKeys: [],
  isActive: "true",
  sortOrder: 0,
};

export default function ProductsPage() {
  return (
    <ResourceManager
      title="Products"
      endpoint="/api/products"
      fields={productFields}
      getTitle={(item) => String(item.name)}
      getSubtitle={(item) =>
        `${item.slug} · $${item.price}${item.paymentModel === "recurring" ? `/${item.interval}` : ""} · ${item.type}`
      }
      emptyItem={emptyProduct}
    />
  );
}
