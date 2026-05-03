import type { ResourceListProps } from "@/types";
import { Button } from "@/components/ui";
import { StatusBadge } from "@/components/ui";

export function ResourceList({
  items,
  loading,
  getTitle,
  getSubtitle,
  onEdit,
  onDelete,
}: ResourceListProps) {
  if (loading) {
    return <p className="text-sm text-gray-500 py-8 text-center">Loading...</p>;
  }

  if (items.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">No records yet.</p>
    );
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
        >
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {getTitle(item)}
            </h3>
            {getSubtitle && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {getSubtitle(item)}
              </p>
            )}
            {item.status && (
              <div className="mt-1.5">
                <StatusBadge status={item.status} />
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary" size="sm" onClick={() => onEdit(item)}>
              Edit
            </Button>
            <Button variant="danger" size="sm" onClick={() => onDelete(item)}>
              Delete
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
