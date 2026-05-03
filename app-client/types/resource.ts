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
