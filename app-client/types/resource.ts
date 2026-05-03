import type React from "react";

export type FieldType =
  | "text"
  | "password"
  | "textarea"
  | "number"
  | "date"
  | "select"
  | "checkboxes";

export type EditorSection = "Basics" | "Content" | "Details";

export type ResourceField = {
  name: string;
  label: string;
  type: FieldType;
  options?: string[];
  optionLabels?: Record<string, string>;
  help?: string;
  section?: EditorSection;
  fullWidth?: boolean;
  /** URL to load options dynamically (for checkboxes). Response: { ok, data: { items: [{ key, description, category }] } } */
  optionsEndpoint?: string;
};

export type ResourceItem = Record<string, unknown> & {
  id?: string;
  status?: string;
};

export type FieldRendererProps = {
  field: ResourceField;
  value: unknown;
  onChange: (value: unknown) => void;
};

export type DynamicOption = {
  key: string;
  description: string;
  category: string;
};

export type ResourceManagerProps = {
  title: string;
  endpoint: string;
  fields: ResourceField[];
  getTitle: (item: ResourceItem) => string;
  getSubtitle?: (item: ResourceItem) => string;
  emptyItem: ResourceItem;
  renderItemActions?: (item: ResourceItem) => React.ReactNode;
  renderEditorExtra?: (
    item: ResourceItem,
    setField: (name: string, value: unknown) => void,
  ) => React.ReactNode;
};

export type ResourceEditorProps = {
  item: ResourceItem;
  fields: ResourceField[];
  title: string;
  saving: boolean;
  onSave: (item: ResourceItem) => void;
  onClose: () => void;
  renderExtra?: (
    item: ResourceItem,
    setField: (name: string, value: unknown) => void,
  ) => React.ReactNode;
};

export type ResourceListProps = {
  items: ResourceItem[];
  loading: boolean;
  getTitle: (item: ResourceItem) => string;
  getSubtitle?: (item: ResourceItem) => string;
  onEdit: (item: ResourceItem) => void;
  onDelete: (item: ResourceItem) => void;
  renderItemActions?: (item: ResourceItem) => React.ReactNode;
};
