"use client";

import { useState } from "react";
import { Button, Notice } from "@/components/ui";
import { ResourceEditor } from "@/components/admin/resource-editor";
import { ResourceList } from "@/components/admin/resource-list";
import { useAdminResource } from "@/hooks/use-admin-resource";
import { resourceService } from "@/services/resource-service";
import type { ResourceField, ResourceItem } from "@/types";

export type { ResourceField, ResourceItem };

type ResourceManagerProps = {
  title: string;
  endpoint: string;
  fields: ResourceField[];
  getTitle: (item: ResourceItem) => string;
  getSubtitle?: (item: ResourceItem) => string;
  emptyItem: ResourceItem;
};

export function ResourceManager({
  title,
  endpoint,
  fields,
  getTitle,
  getSubtitle,
  emptyItem,
}: ResourceManagerProps) {
  const { items, loading, error, reload } =
    useAdminResource<ResourceItem>(endpoint);
  const [editingItem, setEditingItem] = useState<ResourceItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);

  async function handleSave(item: ResourceItem) {
    setSaving(true);
    setNotice(null);

    try {
      await resourceService.save(endpoint, item as Record<string, unknown>);
    } catch (err) {
      setSaving(false);
      setNotice({
        message: err instanceof Error ? err.message : "Save failed.",
        variant: "error",
      });
      return;
    }

    setSaving(false);
    setEditingItem(null);
    setNotice({ message: "Saved successfully.", variant: "success" });
    await reload();
  }

  async function handleDelete(item: ResourceItem) {
    if (!window.confirm(`Delete ${getTitle(item)}?`)) return;
    try {
      await resourceService.remove(endpoint, item.id!);
      await reload();
    } catch (err) {
      setNotice({
        message: err instanceof Error ? err.message : "Delete failed.",
        variant: "error",
      });
    }
  }

  return (
    <section className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your {title.toLowerCase()} from here.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingItem(emptyItem);
            setNotice(null);
          }}
        >
          Add New
        </Button>
      </div>

      {notice && <Notice message={notice.message} variant={notice.variant} />}
      {error && <Notice message={error} variant="error" />}

      {editingItem && (
        <ResourceEditor
          item={editingItem}
          fields={fields}
          title={editingItem.id ? getTitle(editingItem) : title}
          saving={saving}
          onSave={handleSave}
          onClose={() => setEditingItem(null)}
        />
      )}

      <ResourceList
        items={items}
        loading={loading}
        getTitle={getTitle}
        getSubtitle={getSubtitle}
        onEdit={(item) => {
          setEditingItem(item);
          setNotice(null);
        }}
        onDelete={handleDelete}
      />
    </section>
  );
}
