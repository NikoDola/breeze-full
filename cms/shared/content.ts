import { exactKeys, InputError, record, text } from "./validation";
import { services } from "../../src/lib/services";
import { serviceLabels } from "../../src/lib/service-labels";
import { careerExperience, careerBenefits, bestInTown, sayYesToTheBest, longAndShort } from "../../src/lib/company";
import originalSeo from "./content-seo.json";
import promotionSource from "../../src/content/promotions.json";
import { additionalDefinitions, gallerySource, type AdditionalPageId } from "./additional-content";
import { validatePlacement, type MediaPlacement } from "./media";
import { validateSocialImage, type SocialImage } from "./seo";
import { heroAssets, validateHeroImage, validateOfferHeroImages, type HeroImage, type OfferHeroImages } from "./hero-image";

export type ContentRecord = { [key: string]: string | ContentRecord[] | MediaPlacement };
export type ContentField = { kind: "image"; label: string } | { kind: "text"; label: string; max: number; multiline?: boolean; optional?: boolean; choices?: readonly string[] } |
  { kind: "list"; label: string; min: number; max: number; fields: Record<string, ContentField>; fixedIds?: readonly string[] };
export type ContentPageId = keyof typeof serviceLabels | "meet-the-hvac-experts" | "going-green" | "careers" | "promotions" | AdditionalPageId;
export type ContentDocument = SocialImage & HeroImage & { schemaVersion: 6; pageId: ContentPageId; title: string; seoTitle: string; seoDescription: string; content: ContentRecord; offerHeroImages?: OfferHeroImages };
export type ContentDefinition = { label: string; family: "article" | "careers" | "promotions" | "about" | "why" | "contact" | "emergency" | "services" | "gallery" | "legal"; group: "HVAC" | "Company" | "Pages"; icon: string; image: string; fields: Record<string, ContentField>; seed: ContentDocument };
const line = (label: string, max = 200, optional = false): ContentField => ({ kind: "text", label, max, optional });
const copy = (label: string, optional = false): ContentField => ({ kind: "text", label, max: 10000, multiline: true, optional });
const hero = { heading: line("Page heading"), eyebrow: line("Small heading"), tagline: line("Introduction", 500) };
const articleFields: Record<string, ContentField> = { ...hero, summary: copy("Service listing summary", true),
  blocks: { kind: "list", label: "Article sections", min: 1, max: 60, fields: {
    type: { kind: "text", label: "Content type", max: 20, choices: ["paragraph", "heading", "list"] }, text: copy("Text (one item per line for lists)") } },
  calloutHeading: line("Highlighted card heading", 200, true), calloutBody: copy("Highlighted card text", true),
  schedule: copy("Schedule service text", true) };
const entries = (items: readonly string[]) => items.map((text, i) => ({ id: `item-${i + 1}`, text }));
const seed = (pageId: ContentPageId, title: string, description: string, content: ContentRecord): ContentDocument => {
  const seo = (originalSeo as Partial<Record<ContentPageId, { title: string; description: string }>>)[pageId];
  return { schemaVersion: 6, pageId, title, seoTitle: seo?.title ?? title, seoDescription: seo?.description ?? description, content };
};

export const contentDefinitions: Record<ContentPageId, ContentDefinition> = {
  ...additionalDefinitions,
  promotions: { label: "Promotions", family: "promotions", group: "Pages", icon: "tag", image: "/images/summer-promotions.jpg",
    fields: { ...hero, noticeStart: line("Note before financing link", 500), financingLabel: line("Financing link text"), noticeMiddle: line("Note between links", 500), clubLabel: line("Comfort Club link text"), noticeEnd: line("Note after Comfort Club link", 500),
      offers: { kind: "list", label: "Seasonal offers", min: 2, max: 2, fixedIds: ["winter-promotions", "summer-promotions"], fields: {
        heading: line("Offer page title"), tagline: line("Tagline", 500), offer: line("Offer badge"), code: line("Promotion code", 200, true), body: copy("Description"), relatedLabel: line("Service link text"), seoDescription: copy("Search description", true),
      } } },
    seed: seed("promotions", "Promotions", "Seasonal savings from Breeze Heating & Cooling — winter and summer promotions for Middle Tennessee homeowners.", {
      heading: "Promotions", eyebrow: "Save with Breeze", tagline: "Seasonal savings on the work you were going to book anyway.",
      noticeStart: "Promotions can be combined with", financingLabel: "monthly payment financing", noticeMiddle: "— and", clubLabel: "Comfort Club", noticeEnd: "members get priority service year-round.",
      offers: promotionSource.items.map(offer => ({ id: offer.slug, heading: offer.title, tagline: offer.tagline, offer: offer.offer, code: offer.code, body: offer.blurb, relatedLabel: offer.otherLabel, seoDescription: offer.metaDescription })),
    }) },
  ...Object.fromEntries(services.map(service => [service.slug, { label: service.title, family: "article", group: "HVAC", icon: service.icon, image: service.image, fields: articleFields,
    seed: seed(service.slug as ContentPageId, service.title, `${service.tagline} — Breeze Heating & Cooling, Middle Tennessee.`, {
      heading: service.title, eyebrow: "HVAC Services", tagline: service.tagline, summary: service.blurb,
      blocks: service.blocks.map((block, i) => ({ id: `block-${i + 1}`, type: block.type === "p" ? "paragraph" : block.type === "h3" ? "heading" : "list", text: block.type === "list" ? block.items.join("\n") : block.text })),
      calloutHeading: "", calloutBody: "", schedule: service.scheduleIt,
    }) }])) as Record<keyof typeof serviceLabels, ContentDefinition>,
  ...Object.fromEntries((["meet-the-hvac-experts", "going-green"] as const).map(pageId => {
    const experts = pageId === "meet-the-hvac-experts";
    const title = experts ? "Meet the HVAC experts" : "Going green";
    return [pageId, { label: title, family: "article", group: "Company", icon: experts ? "users" : "leaf", image: experts ? "/images/Guy-working.jpg" : "/images/mass-energy-audit.png", fields: articleFields,
      seed: seed(pageId, title, experts ? "Breeze hires only the most qualified technicians. Every team member is certified by the North American Technician Excellence (NATE) organization." : "The most energy-efficient products in the industry, installed right — so your system costs less to run and lasts longer.", {
        heading: title, eyebrow: "About us", tagline: experts ? "Say YES to the Best" : "The most energy-efficient products in the industry", summary: "",
        blocks: [{ id: "intro-heading", type: "heading", text: bestInTown.heading }, { id: "intro", type: "paragraph", text: bestInTown.body },
          { id: "experts-heading", type: "heading", text: sayYesToTheBest.heading }, ...sayYesToTheBest.paragraphs.map((text, i) => ({ id: `paragraph-${i + 1}`, type: "paragraph", text }))],
        calloutHeading: longAndShort.heading, calloutBody: longAndShort.paragraphs.join("\n\n"), schedule: "",
      }) }];
  })) as Record<"meet-the-hvac-experts" | "going-green", ContentDefinition>,
  careers: { label: "Careers", family: "careers", group: "Company", icon: "briefcase", image: "/images/Guy-working.jpg",
    fields: { ...hero, cards: { kind: "list", label: "Careers cards", min: 0, max: 12, fields: {
      heading: line("Card heading"), items: { kind: "list", label: "Bullet points", min: 1, max: 30, fields: { text: copy("Bullet point") } },
    } }, formHeading: line("Application form heading", 300) },
    seed: seed("careers", "Careers", "Join Breeze Heating & Cooling. Competitive pay, guaranteed 40 hours, paid holidays, retirement matching and in-house training on new equipment.", {
      heading: "Careers", eyebrow: "Join the team", tagline: "Some of the perks and benefits we offer",
      cards: [{ id: "experience", heading: "Experience", items: entries(careerExperience) }, { id: "benefits", heading: "Benefits to Consider", items: entries(careerBenefits) }],
      formHeading: "Please fill out our online form for employment",
    }),
  },
};
export const isContentPage = (value: string): value is ContentPageId => Object.hasOwn(contentDefinitions, value);
export const contentPages = Object.fromEntries(Object.entries(contentDefinitions).map(([id, definition]) => [id, { id, slug: id, path: `/${id}`, label: definition.label, cacheTag: `cms:preview:cms-testing:page:${id}` }])) as { [Id in ContentPageId]: { id: Id; slug: Id; path: `/${Id}`; label: string; cacheTag: string } };
export const contentText = (content: ContentRecord, key: string) => content[key] as string;
export const contentItems = (content: ContentRecord, key: string) => content[key] as ContentRecord[];
export function emptyContent(fields: Record<string, ContentField>): ContentRecord {
  return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.kind === "text" ? field.choices?.[0] ?? "" : field.kind === "image" ? "" : []]));
}
function validateContent(value: unknown, fields: Record<string, ContentField>, label: string): ContentRecord {
  const source = record(value);
  exactKeys(source, Object.keys(fields), label);
  return Object.fromEntries(Object.entries(fields).map(([key, field]) => {
    if (field.kind === "image") {
      if (typeof source[key] === "string") {
        if (!gallerySource.some(image => image.image === source[key])) throw new InputError("Choose an approved site photo or an uploaded image.");
        return [key, source[key]];
      }
      return [key, validatePlacement(source[key])];
    }
    if (field.kind === "text") {
      const parsed = text(source[key], `${label} / ${field.label}`, field.max, !field.optional);
      if (field.choices && !field.choices.includes(parsed)) throw new InputError(`Choose a valid ${field.label}.`);
      return [key, parsed];
    }
    const items = source[key];
    if (!Array.isArray(items) || items.length < field.min || items.length > field.max) throw new InputError(`${field.label} needs ${field.min}–${field.max} items.`);
    const ids = new Set<string>();
    return [key, items.map((value, index) => {
      const item = record(value), id = text(item.id, `${field.label} ID`, 80, true);
      if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id) || (field.fixedIds && id !== field.fixedIds[index])) throw new InputError(`${field.label} IDs must be unique and preserve fixed entries.`);
      ids.add(id);
      const { id: ignored, ...body } = item;
      void ignored;
      return { id, ...validateContent(body, field.fields, `${field.label} ${index + 1}`) };
    })];
  }));
}
export function contentAssets(document: ContentDocument): MediaPlacement[] {
  const collect = (content: ContentRecord, fields: Record<string, ContentField>): MediaPlacement[] => Object.entries(fields).flatMap(([key, field]) => field.kind === "image" ? typeof content[key] === "string" ? [] : [content[key] as MediaPlacement] : field.kind === "list" ? (content[key] as ContentRecord[]).flatMap(item => collect(item, field.fields)) : []);
  return [...collect(document.content, contentDefinitions[document.pageId].fields), ...(document.ogImage && typeof document.ogImage !== "string" ? [document.ogImage] : []), ...heroAssets(document)];
}
export function validateContentDocument(value: unknown, pageId?: string): ContentDocument {
  const doc = record(value);
  exactKeys(doc, ["schemaVersion", "pageId", "title", "seoTitle", "seoDescription", "ogImage", "heroImage", "offerHeroImages", "content"], "page");
  if (doc.schemaVersion !== 6 || typeof doc.pageId !== "string" || !isContentPage(doc.pageId) || (pageId && doc.pageId !== pageId)) throw new InputError("This content belongs to a different page or an unsupported template.");
  const content = validateContent(doc.content, contentDefinitions[doc.pageId].fields, contentDefinitions[doc.pageId].label);
  if (contentDefinitions[doc.pageId].family === "article" && Boolean(content.calloutHeading) !== Boolean(content.calloutBody)) throw new InputError("Complete both highlighted card fields, or leave both empty.");
  return { schemaVersion: 6, pageId: doc.pageId, title: text(doc.title, "Internal page title", 200, true), seoTitle: text(doc.seoTitle, "Search title", 200, true), seoDescription: text(doc.seoDescription, "Search description", 500), ...validateSocialImage(doc), ...validateHeroImage(doc), ...validateOfferHeroImages(doc, doc.pageId), content };
}
