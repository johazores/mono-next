"use client";

import { ResourceManager } from "@/components/admin";
import type { ResourceField, ResourceItem } from "@/types";

const userFields: ResourceField[] = [
  { name: "name", label: "Name", type: "text" },
  { name: "email", label: "Email", type: "text" },
  {
    name: "password",
    label: "Password",
    type: "password",
    help: "Minimum 8 characters. Leave blank when editing to keep current password.",
  },
  {
    name: "status",
    label: "Status",
    type: "select",
    options: ["active", "disabled"],
  },
];

const emptyUser: ResourceItem = {
  name: "",
  email: "",
  password: "",
  status: "active",
};

export default function UsersPage() {
  return (
    <ResourceManager
      title="Users"
      endpoint="/api/users"
      fields={userFields}
      getTitle={(item) => String(item.name || item.email)}
      getSubtitle={(item) => `${item.email}`}
      emptyItem={emptyUser}
    />
  );
}
