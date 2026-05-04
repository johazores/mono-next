import type { ResourceListProps } from "@/types";
import { Button, StatusBadge, EmptyState } from "@/components/ui";

export function ResourceList({
  items,
  loading,
  getTitle,
  getSubtitle,
  onEdit,
  onDelete,
  renderItemActions,
}: ResourceListProps) {
  if (loading) {
    return (
      <p className="py-8 text-center text-sm text-muted">Loading&hellip;</p>
    );
  }

  if (items.length === 0) {
    return <EmptyState message="No records yet." />;
  }

  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-4 shadow-sm"
        >
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {getTitle(item)}
            </h3>
            {getSubtitle && (
              <p className="text-xs text-muted mt-0.5 truncate">
                {getSubtitle(item)}
              </p>
            )}
            {item.status && (
              <div className="mt-1.5">
                <StatusBadge
                  status={item.status}
                  variant={item.status === "active" ? "success" : "muted"}
                />
              </div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {renderItemActions && renderItemActions(item)}
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
