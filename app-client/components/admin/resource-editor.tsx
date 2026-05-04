"use client";

import { Fragment, useMemo, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { FieldRenderer } from "@/components/admin/field-renderer";
import type {
  EditorSection,
  ResourceField,
  ResourceItem,
  ResourceEditorProps,
} from "@/types";

function getFieldSection(field: ResourceField): EditorSection {
  if (field.section) return field.section;
  if (["summary", "description"].includes(field.name)) return "Content";
  return "Basics";
}

export function ResourceEditor({
  item,
  fields,
  title,
  saving,
  onSave,
  onClose,
  renderExtra,
}: ResourceEditorProps) {
  const [editing, setEditing] = useState<ResourceItem>(item);
  const [activeSection, setActiveSection] = useState<EditorSection>("Basics");

  const isNew = !item.id;

  const sections = useMemo(() => {
    const ordered: EditorSection[] = ["Basics", "Content", "Details"];
    return ordered.filter((section) =>
      fields.some((field) => getFieldSection(field) === section),
    );
  }, [fields]);

  function setField(name: string, value: unknown) {
    setEditing((current) => ({ ...current, [name]: value }));
  }

  return (
    <Modal
      title={isNew ? `New ${title}` : `Edit ${title}`}
      subtitle="Fill in the details below and save when you're done."
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => onSave(editing)}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      }
    >
      {sections.length > 1 && (
        <div
          className="flex gap-1 border-b border-border mb-4"
          role="tablist"
          aria-label={`${title} editor sections`}
        >
          {sections.map((section) => (
            <button
              key={section}
              type="button"
              role="tab"
              aria-selected={activeSection === section}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === section
                  ? "border-primary text-primary"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {fields
          .filter((field) => getFieldSection(field) === activeSection)
          .map((field) => (
            <Fragment key={field.name}>
              <FieldRenderer
                field={field}
                value={editing[field.name] ?? ""}
                onChange={(val) => setField(field.name, val)}
              />
            </Fragment>
          ))}
      </div>

      {renderExtra && renderExtra(editing, setField)}
    </Modal>
  );
}
