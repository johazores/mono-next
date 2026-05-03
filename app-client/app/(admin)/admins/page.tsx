"use client";

import { ResourceManager } from "@/components/admin";
import type { ResourceField, ResourceItem } from "@/types";

const adminFields: ResourceField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "email", label: "Email", type: "text" },
  {
    name: "password",
    label: "Password",
    type: "password",
    help: "Minimum 8 characters. Leave blank when editing to keep current password.",
  },
  { name: "role", label: "Role", type: "select", options: ["admin", "editor"] },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: ["active", "disabled"],
  },
];

const emptyAdmin: ResourceItem = {
  name: "",
  email: "",
  password: "",
  role: "editor",
  status: "active",
};

export default function AdminsPage() {
  return (
    <ResourceManager
      title="Admins"
      endpoint="/api/admins"
      fields={adminFields}
      getTitle={(item) => String(item.name || item.email)}
      getSubtitle={(item) => `${item.role} · ${item.email}`}
      emptyItem={emptyAdmin}
    />
  );
}
