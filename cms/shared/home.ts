import { InputError, exactKeys, record, text } from "./validation";

export type TextField = { kind: "text"; label: string; max: number; multiline?: boolean; help?: string; format?: "maps-link" };
export type ArrayField = { kind: "array"; label: string; min: number; max: number; fields: Record<string, TextField>; fixedIds?: readonly string[]; help?: string };
export type Field = TextField | ArrayField;
export type SectionSchema = { type: string; version: 1; label: string; help: string; fields: Record<string, Field> };
const line = (label: string, max = 180, help?: string): TextField => ({ kind: "text", label, max, help });
const paragraph = (label: string): TextField => ({ kind: "text", label, max: 3000, multiline: true });

// This registry defines content and editor controls, never arbitrary layouts or markup.
export const homeSectionRegistry = {
  seasons: {
    type: "breeze.seasons", version: 1, label: "Heating & cooling",
    help: "The cooling and heating cards keep their icons, order, and service-request links.",
    fields: {
      headingLine1: line("Heading — first line"), headingLine2: line("Heading — second line"),
      headingAccent: line("Heading — orange text"), intro: paragraph("Introduction"),
      cards: { kind: "array", label: "Service cards", min: 2, max: 2, fixedIds: ["cooling", "heating"],
        fields: { title: line("Card heading"), label: line("Service label", 80), body: paragraph("Description"), buttonText: line("Link text", 100) } },
    },
  },
  contact: {
    type: "breeze.contact-intro", version: 1, label: "Contact introduction",
    help: "Edit the text beside the form. The phone number comes from Breeze's shared business details.",
    fields: { heading: line("Heading"), headingAccent: line("Heading — orange text"), intro: paragraph("Introduction"), phonePrompt: line("Phone prompt", 100) },
  },
  reviews: {
    type: "breeze.home-reviews", version: 1, label: "Reviews",
    help: "The original review cards keep their five-star presentation. Add, remove, or reorder testimonials here.",
    fields: {
      heading: line("Heading — first line"), headingAccent: line("Heading — orange second line"), intro: paragraph("Introduction"),
      items: { kind: "array", label: "Testimonials", min: 1, max: 12,
        fields: { name: line("Customer name", 180), quote: paragraph("Review") } },
    },
  },
  area: {
    type: "breeze.area", version: 1, label: "Service area",
    help: "The map remains the last section. Its location is a place name or address, not embed code.",
    fields: {
      heading: line("Heading"), headingAccent: line("Heading — orange text"), body: paragraph("Description"),
      linkText: line("Map link text"), mapsHref: { ...line("Google Maps link", 2048), format: "maps-link" },
      mapTitle: line("Accessible map title"), mapLocation: line("Map location", 300),
    },
  },
} as const satisfies Record<string, SectionSchema>;

export type HomeSlot = keyof typeof homeSectionRegistry;
export const homeSlotOrder: readonly HomeSlot[] = ["seasons", "contact", "reviews", "area"];
export type SeasonsContent = { headingLine1: string; headingLine2: string; headingAccent: string; intro: string; cards: { id: string; title: string; label: string; body: string; buttonText: string }[] };
export type ContactContent = { heading: string; headingAccent: string; intro: string; phonePrompt: string };
export type ReviewsContent = { heading: string; headingAccent: string; intro: string; items: { id: string; name: string; quote: string }[] };
export type AreaContent = { heading: string; headingAccent: string; body: string; linkText: string; mapsHref: string; mapTitle: string; mapLocation: string };
type Slot<T, Name extends string> = { type: Name; version: 1; content: T };
export type HomeDocument = {
  schemaVersion: 2; template: "breeze.home"; templateVersion: 1; title: string;
  slots: {
    seasons: Slot<SeasonsContent, "breeze.seasons">;
    contact: Slot<ContactContent, "breeze.contact-intro">;
    reviews: Slot<ReviewsContent, "breeze.home-reviews">;
    area: Slot<AreaContent, "breeze.area">;
  };
};

function parseText(value: unknown, field: TextField, path: string) {
  const result = text(value, path, field.max, true);
  if (field.format === "maps-link") {
    let valid = false;
    try {
      const url = new URL(result);
      valid = url.protocol === "https:" && url.hostname === "www.google.com" && !url.port && !url.username && !url.password &&
        /^\/maps(?:\/|$)/.test(url.pathname) && !/[\s\\\u0000-\u001f\u007f]/.test(result);
    } catch { /* report the field below */ }
    if (!valid) throw new InputError("Use a full https://www.google.com/maps link.");
  }
  return result;
}

function parseContent(value: unknown, fields: Record<string, Field>, path: string) {
  const content = record(value), parsed: Record<string, unknown> = {};
  exactKeys(content, Object.keys(fields), path);
  for (const [key, field] of Object.entries(fields)) {
    const item = content[key], name = `${path} / ${field.label}`;
    if (field.kind === "text") { parsed[key] = parseText(item, field, name); continue; }
    if (!Array.isArray(item) || item.length < field.min || item.length > field.max) throw new InputError(`${name} needs ${field.min}–${field.max} items.`);
    const ids = new Set<string>();
    parsed[key] = item.map((entry, index) => {
      const object = record(entry), id = text(object.id, `${name} ID`, 80, true);
      if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id) || (field.fixedIds && id !== field.fixedIds[index])) throw new InputError(`Invalid item order or ID in ${name}.`);
      ids.add(id);
      exactKeys(object, ["id", ...Object.keys(field.fields)], name);
      const result: Record<string, string> = { id };
      for (const [childKey, childField] of Object.entries(field.fields)) result[childKey] = parseText(object[childKey], childField, `${name} ${index + 1} / ${childField.label}`);
      return result;
    });
  }
  return parsed;
}

export function validateHomeDocument(value: unknown): HomeDocument {
  const doc = record(value);
  exactKeys(doc, ["schemaVersion", "template", "templateVersion", "title", "slots"], "homepage");
  if (doc.schemaVersion !== 2 || doc.template !== "breeze.home" || doc.templateVersion !== 1) throw new InputError("Unsupported homepage document version.");
  const source = record(doc.slots), slots: Record<string, unknown> = {};
  exactKeys(source, homeSlotOrder, "homepage sections");
  for (const key of homeSlotOrder) {
    const schema = homeSectionRegistry[key], section = record(source[key]);
    exactKeys(section, ["type", "version", "content"], schema.label);
    if (section.type !== schema.type || section.version !== schema.version) throw new InputError(`Unsupported ${schema.label} section.`);
    slots[key] = { type: schema.type, version: schema.version, content: parseContent(section.content, schema.fields, schema.label) };
  }
  return { schemaVersion: 2, template: "breeze.home", templateVersion: 1, title: text(doc.title, "page title", 200, true), slots } as HomeDocument;
}

export function homeMapSource(location: string) {
  return `https://www.google.com/maps?q=${encodeURIComponent(location)}&output=embed`;
}
