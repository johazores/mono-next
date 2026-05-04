"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { cmsContentTypeService } from "@/services/cms-service";
import { slugify } from "@/lib/slugify";
import type { ContentType, ContentFieldDefinition } from "@/types";
import {
  Plus,
  Pencil,
  Trash2,
  Layers,
  FileText,
  Briefcase,
  Users as UsersIcon,
  Zap,
  Package,
  MessageSquare,
  HelpCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Starter templates — pre-configured field sets
// ---------------------------------------------------------------------------

type StarterTemplate = {
  label: string;
  description: string;
  icon: typeof FileText;
  defaults: {
    name: string;
    slug: string;
    pluralName: string;
    icon: string;
    description: string;
    fields: ContentFieldDefinition[];
  };
};

const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    label: "Blog Post",
    description:
      "Standard post with all built-in fields. Add categories, tags, and reading time.",
    icon: FileText,
    defaults: {
      name: "Blog Post",
      slug: "blog-posts",
      pluralName: "Blog Posts",
      icon: "file-text",
      description:
        "Blog articles with content, excerpt, featured image, and author (all built-in).",
      fields: [
        { name: "category", label: "Category", type: "text", width: "half" },
        {
          name: "tags",
          label: "Tags",
          type: "text",
          width: "half",
          placeholder: "Comma-separated tags",
        },
        {
          name: "reading_time",
          label: "Reading Time (min)",
          type: "number",
          width: "half",
        },
        {
          name: "source_url",
          label: "Source / Reference URL",
          type: "url",
          width: "half",
        },
      ],
    },
  },
  {
    label: "Page",
    description:
      "Static page with content, sidebar option, and parent page support.",
    icon: FileText,
    defaults: {
      name: "Page",
      slug: "pages",
      pluralName: "Pages",
      icon: "file",
      description:
        "Static pages like About, Contact, Terms. Content, excerpt, and featured image are built-in.",
      fields: [
        {
          name: "parent_page",
          label: "Parent Page",
          type: "text",
          width: "half",
        },
        {
          name: "show_in_nav",
          label: "Show in Navigation",
          type: "boolean",
          width: "half",
        },
        { name: "css_class", label: "CSS Class", type: "text", width: "half" },
      ],
    },
  },
  {
    label: "Service",
    description: "Service page with pricing, icon, and call-to-action.",
    icon: Briefcase,
    defaults: {
      name: "Service",
      slug: "services",
      pluralName: "Services",
      icon: "briefcase",
      description:
        "Professional services. Content and featured image are built-in.",
      fields: [
        {
          name: "summary",
          label: "Short Summary",
          type: "textarea",
          width: "full",
        },
        {
          name: "icon_name",
          label: "Icon (Lucide name)",
          type: "text",
          width: "half",
        },
        { name: "price", label: "Price", type: "text", width: "half" },
        {
          name: "price_note",
          label: "Price Note",
          type: "text",
          width: "half",
          placeholder: "e.g. per month",
        },
        {
          name: "cta_text",
          label: "CTA Button Text",
          type: "text",
          width: "half",
        },
        {
          name: "cta_url",
          label: "CTA Button URL",
          type: "url",
          width: "half",
        },
        {
          name: "highlights",
          label: "Key Highlights",
          type: "array-text",
          width: "full",
        },
      ],
    },
  },
  {
    label: "Team Member",
    description: "Staff profiles with role, contact info, and social links.",
    icon: UsersIcon,
    defaults: {
      name: "Team Member",
      slug: "team",
      pluralName: "Team",
      icon: "users",
      description:
        "Team profiles. Photo uses the built-in featured image; bio uses the built-in content.",
      fields: [
        {
          name: "role",
          label: "Role / Job Title",
          type: "text",
          width: "half",
        },
        {
          name: "department",
          label: "Department",
          type: "text",
          width: "half",
        },
        { name: "email", label: "Email", type: "text", width: "half" },
        { name: "phone", label: "Phone", type: "text", width: "half" },
        { name: "linkedin", label: "LinkedIn URL", type: "url", width: "half" },
        {
          name: "twitter",
          label: "Twitter / X URL",
          type: "url",
          width: "half",
        },
      ],
    },
  },
  {
    label: "Product / Portfolio",
    description: "Showcase items with gallery, specs, and pricing.",
    icon: Package,
    defaults: {
      name: "Portfolio Item",
      slug: "portfolio",
      pluralName: "Portfolio",
      icon: "image",
      description:
        "Showcase items. Description and featured image are built-in.",
      fields: [
        {
          name: "gallery",
          label: "Gallery Images",
          type: "gallery-list",
          width: "full",
        },
        { name: "category", label: "Category", type: "text", width: "half" },
        { name: "client", label: "Client", type: "text", width: "half" },
        {
          name: "project_url",
          label: "Project URL",
          type: "url",
          width: "half",
        },
        {
          name: "completion_date",
          label: "Completion Date",
          type: "date",
          width: "half",
        },
        {
          name: "technologies",
          label: "Technologies Used",
          type: "array-text",
          width: "full",
        },
      ],
    },
  },
  {
    label: "Event",
    description: "Events with date/time, location, and registration.",
    icon: Zap,
    defaults: {
      name: "Event",
      slug: "events",
      pluralName: "Events",
      icon: "calendar",
      description:
        "Events and happenings. Description and featured image are built-in.",
      fields: [
        {
          name: "start_date",
          label: "Start Date & Time",
          type: "date",
          width: "half",
        },
        {
          name: "end_date",
          label: "End Date & Time",
          type: "date",
          width: "half",
        },
        { name: "location", label: "Location", type: "text", width: "full" },
        { name: "address", label: "Address", type: "textarea", width: "full" },
        {
          name: "registration_url",
          label: "Registration URL",
          type: "url",
          width: "half",
        },
        {
          name: "price",
          label: "Price / Admission",
          type: "text",
          width: "half",
        },
        { name: "organizer", label: "Organizer", type: "text", width: "half" },
        { name: "capacity", label: "Capacity", type: "number", width: "half" },
      ],
    },
  },
  {
    label: "Testimonial",
    description: "Customer reviews with rating and company info.",
    icon: MessageSquare,
    defaults: {
      name: "Testimonial",
      slug: "testimonials",
      pluralName: "Testimonials",
      icon: "message-square",
      description:
        "Customer testimonials. Quote text goes in the built-in content field.",
      fields: [
        { name: "company", label: "Company", type: "text", width: "half" },
        { name: "role", label: "Title / Role", type: "text", width: "half" },
        {
          name: "rating",
          label: "Rating (1-5)",
          type: "number",
          width: "half",
        },
        { name: "website", label: "Website URL", type: "url", width: "half" },
      ],
    },
  },
  {
    label: "FAQ",
    description: "Frequently asked questions with category support.",
    icon: HelpCircle,
    defaults: {
      name: "FAQ",
      slug: "faqs",
      pluralName: "FAQs",
      icon: "help-circle",
      description:
        "FAQ entries. The question is the title; answer goes in the built-in content field.",
      fields: [
        { name: "category", label: "Category", type: "text", width: "half" },
        {
          name: "related_url",
          label: "Related Page URL",
          type: "url",
          width: "half",
        },
      ],
    },
  },
  {
    label: "Empty (custom)",
    description:
      "Start from scratch. All standard fields (content, excerpt, featured image, etc.) are still included.",
    icon: Layers,
    defaults: {
      name: "",
      slug: "",
      pluralName: "",
      icon: "",
      description: "",
      fields: [],
    },
  },
];

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

async function fetchContentTypes() {
  const result = await cmsContentTypeService.list();
  return result.data?.items ?? [];
}

export default function ContentTypesPage() {
  const router = useRouter();
  const { data: contentTypes = [], mutate } = useSWR<ContentType[]>(
    "/api/cms/content-types",
    fetchContentTypes,
  );
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<StarterTemplate | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Create form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [pluralName, setPluralName] = useState("");
  const [icon, setIcon] = useState("");
  const [description, setDescription] = useState("");

  function selectTemplate(tpl: StarterTemplate) {
    setSelectedTemplate(tpl);
    setName(tpl.defaults.name);
    setSlug(tpl.defaults.slug);
    setPluralName(tpl.defaults.pluralName);
    setIcon(tpl.defaults.icon);
    setDescription(tpl.defaults.description);
    setError("");
  }

  function resetCreate() {
    setShowCreate(false);
    setSelectedTemplate(null);
    setName("");
    setSlug("");
    setPluralName("");
    setIcon("");
    setDescription("");
    setError("");
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await cmsContentTypeService.create({
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        pluralName: pluralName.trim() || name.trim(),
        icon: icon.trim() || undefined,
        description: description.trim() || undefined,
        status: "active",
        sortOrder: 0,
        fields: selectedTemplate?.defaults.fields ?? [],
        settings: {
          hasSlug: true,
          hasStatus: true,
          hasSortOrder: true,
          slugSource: "name",
          defaultStatus: "draft",
        },
        publicSettings: {
          hasPublicList: false,
          hasDetailPage: false,
          urlPrefix: null,
        },
      } as Partial<ContentType>);
      await mutate();
      resetCreate();
      // Redirect to the full editor so they can fine-tune fields
      if (result.data) {
        router.push(`/admin/content-types/${(result.data as ContentType).id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(ct: ContentType) {
    if (!window.confirm(`Delete "${ct.name}"? This cannot be undone.`)) return;
    try {
      await cmsContentTypeService.delete(ct.id);
      await mutate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  }

  const inputClass =
    "w-full rounded-md border border-[var(--theme-border)] bg-[var(--theme-surface)] px-3 py-1.5 text-sm";

  // --- Create flow ---
  if (showCreate) {
    // Step 1: Choose a template
    if (!selectedTemplate) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[var(--theme-text)]">
                New Content Type
              </h1>
              <p className="mt-1 text-sm text-[var(--theme-muted)]">
                Choose a starter template or start from scratch.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md border border-[var(--theme-border)] px-4 py-1.5 text-sm hover:bg-[var(--theme-surface)]"
              onClick={resetCreate}
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {STARTER_TEMPLATES.map((tpl) => {
              const Icon = tpl.icon;
              return (
                <button
                  key={tpl.label}
                  type="button"
                  className="group rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg,var(--theme-background))] p-5 text-left shadow-sm transition-all hover:border-[var(--theme-primary)] hover:shadow-md"
                  onClick={() => selectTemplate(tpl)}
                >
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--theme-primary)]/10">
                    <Icon size={20} className="text-[var(--theme-primary)]" />
                  </div>
                  <h3 className="font-semibold text-[var(--theme-text)]">
                    {tpl.label}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--theme-muted)]">
                    {tpl.description}
                  </p>
                  {tpl.defaults.fields.length > 0 && (
                    <p className="mt-2 text-xs text-[var(--theme-muted)]">
                      {tpl.defaults.fields.length} fields pre-configured
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    // Step 2: Fill in details
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[var(--theme-text)]">
              New Content Type
            </h1>
            <p className="mt-1 text-sm text-[var(--theme-muted)]">
              Template:{" "}
              <span className="font-medium">{selectedTemplate.label}</span>
              {" · "}
              <button
                type="button"
                className="text-[var(--theme-primary)] hover:underline"
                onClick={() => setSelectedTemplate(null)}
              >
                Change template
              </button>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-[var(--theme-border)] px-4 py-1.5 text-sm hover:bg-[var(--theme-surface)]"
              onClick={resetCreate}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              disabled={saving}
              onClick={handleCreate}
            >
              {saving ? "Creating..." : "Create & Configure"}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg,var(--theme-background))] p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-[var(--theme-muted)] uppercase tracking-wide">
            Details
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <label>
              <span className="text-sm font-medium text-[var(--theme-text)]">
                Name *
              </span>
              <input
                className={inputClass}
                value={name}
                onChange={(e) => {
                  const v = e.target.value;
                  setName(v);
                  if (!slug || slug === slugify(name)) {
                    setSlug(slugify(v));
                  }
                }}
                placeholder="Blog Post"
              />
            </label>
            <label>
              <span className="text-sm font-medium text-[var(--theme-text)]">
                Slug
              </span>
              <input
                className={inputClass}
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder={name ? slugify(name) : "blog-posts"}
              />
              <span className="text-xs text-[var(--theme-muted)]">
                URL-friendly identifier. Auto-generated from name.
              </span>
            </label>
            <label>
              <span className="text-sm font-medium text-[var(--theme-text)]">
                Plural Name
              </span>
              <input
                className={inputClass}
                value={pluralName}
                onChange={(e) => setPluralName(e.target.value)}
                placeholder={name ? `${name}s` : "Blog Posts"}
              />
            </label>
            <label>
              <span className="text-sm font-medium text-[var(--theme-text)]">
                Icon (Lucide name)
              </span>
              <input
                className={inputClass}
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="file-text"
              />
            </label>
            <label className="col-span-2">
              <span className="text-sm font-medium text-[var(--theme-text)]">
                Description
              </span>
              <textarea
                className={inputClass}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </label>
          </div>
        </div>

        {selectedTemplate.defaults.fields.length > 0 && (
          <div className="rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg,var(--theme-background))] p-6 shadow-sm">
            <h3 className="mb-2 text-sm font-semibold text-[var(--theme-muted)] uppercase tracking-wide">
              Pre-configured Fields
            </h3>
            <p className="mb-3 text-sm text-[var(--theme-muted)]">
              These fields will be created automatically. You can customize them
              on the next screen.
            </p>
            <div className="divide-y divide-[var(--theme-border)]">
              {selectedTemplate.defaults.fields.map((f) => (
                <div
                  key={f.name}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <span className="text-sm font-medium text-[var(--theme-text)]">
                      {f.label}
                    </span>
                    <span className="ml-2 text-xs text-[var(--theme-muted)]">
                      ({f.name})
                    </span>
                  </div>
                  <span className="rounded-full bg-[var(--theme-surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--theme-muted)]">
                    {f.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- List view ---
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--theme-text)]">
            Content Types
          </h1>
          <p className="mt-1 text-sm text-[var(--theme-muted)]">
            Define the types of content on your site. Each type has its own
            fields, settings, and public pages.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-md bg-[var(--theme-primary)] px-4 py-1.5 text-sm font-medium text-white hover:opacity-90"
          onClick={() => setShowCreate(true)}
        >
          <Plus size={16} />
          Add New
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {contentTypes.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--theme-border)] bg-[var(--theme-bg,var(--theme-background))] p-10 text-center">
          <Layers
            size={40}
            className="mx-auto mb-3 text-[var(--theme-muted)]"
          />
          <p className="font-medium text-[var(--theme-text)]">
            No content types yet
          </p>
          <p className="mt-1 text-sm text-[var(--theme-muted)]">
            Create your first content type to start adding content like blog
            posts, services, or team members.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-[var(--theme-primary)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            onClick={() => setShowCreate(true)}
          >
            <Plus size={16} />
            Create Content Type
          </button>
        </div>
      )}

      <div className="space-y-3">
        {contentTypes.map((ct) => {
          const fieldCount = Array.isArray(ct.fields)
            ? (ct.fields as unknown[]).length
            : 0;
          return (
            <div
              key={ct.id}
              className="flex items-center justify-between rounded-xl border border-[var(--theme-border)] bg-[var(--theme-bg,var(--theme-background))] p-4 shadow-sm"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-[var(--theme-text)]">
                  {ct.name}
                </h3>
                <p className="mt-0.5 text-xs text-[var(--theme-muted)]">
                  /{ct.slug} · {ct.status} · {fieldCount} field
                  {fieldCount !== 1 ? "s" : ""}
                </p>
                {fieldCount === 0 && (
                  <p className="mt-1 text-xs text-amber-600">
                    ⚠ No fields configured — items will only have title, slug,
                    and status.
                  </p>
                )}
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/admin/content-types/${ct.id}`}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--theme-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--theme-muted)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-text)] transition-colors"
                >
                  <Pencil size={12} />
                  Configure
                </Link>
                <Link
                  href={`/admin/content/${ct.slug}`}
                  className="inline-flex items-center gap-1 rounded-md border border-[var(--theme-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--theme-muted)] hover:bg-[var(--theme-surface)] hover:text-[var(--theme-text)] transition-colors"
                >
                  View Items
                </Link>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => handleDelete(ct)}
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
