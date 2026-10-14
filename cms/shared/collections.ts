import { exactKeys, InputError, record, text } from "./validation";

export type ReviewItem = { id: string; name: string; quote: string; homeQuote: string; visible: boolean };
export type ReviewsDocument = { schemaVersion: 4; title: string; items: ReviewItem[]; favoriteIds: string[] };
export const socialPlatforms = {
  facebook: { label: "Facebook", hosts: ["facebook.com", "www.facebook.com", "fb.com"] },
  instagram: { label: "Instagram", hosts: ["instagram.com", "www.instagram.com"] },
  youtube: { label: "YouTube", hosts: ["youtube.com", "www.youtube.com"] },
  linkedin: { label: "LinkedIn", hosts: ["linkedin.com", "www.linkedin.com"] },
  tiktok: { label: "TikTok", hosts: ["tiktok.com", "www.tiktok.com"] },
  x: { label: "X", hosts: ["x.com", "www.x.com", "twitter.com", "www.twitter.com"] },
} as const;
export type SocialPlatform = keyof typeof socialPlatforms;
export type SocialLink = { platform: SocialPlatform; href: string };
export type GlobalDocument = { schemaVersion: 5; title: string; phone: string; email: string; formRecipientEmail?: string; socials: SocialLink[] };

function emailAddress(value: unknown, label: string) {
  const email = text(value, label, 254, true).trim();
  if (!/^[a-zA-Z0-9.!#$&'*+\/=^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/.test(email)) throw new InputError(`Enter a valid ${label}.`);
  return email;
}

export function validateReviews(value: unknown): ReviewsDocument {
  const doc = record(value);
  exactKeys(doc, ["schemaVersion", "title", "items", "favoriteIds"], "reviews");
  if (doc.schemaVersion !== 4 || !Array.isArray(doc.items) || doc.items.length > 50) throw new InputError("Reviews supports up to 50 entries.");
  const ids = new Set<string>();
  const items = doc.items.map(value => {
    const item = record(value);
    exactKeys(item, ["id", "name", "quote", "homeQuote", "visible"], "review");
    const id = text(item.id, "review ID", 80, true);
    if (!/^[a-zA-Z0-9_-]+$/.test(id) || ids.has(id)) throw new InputError("Review IDs must be unique.");
    ids.add(id);
    if (typeof item.visible !== "boolean") throw new InputError("Invalid review visibility.");
    return { id, name: text(item.name, "reviewer name", 180, true), quote: text(item.quote, "review", 4000, true),
      homeQuote: text(item.homeQuote, "homepage excerpt", 3000), visible: item.visible };
  });
  if (!Array.isArray(doc.favoriteIds) || doc.favoriteIds.length > 3 || new Set(doc.favoriteIds).size !== doc.favoriteIds.length) throw new InputError("Choose up to three different homepage favorites.");
  const favoriteIds = doc.favoriteIds.map(value => {
    const id = text(value, "favorite ID", 80, true);
    if (!items.some(item => item.id === id && item.visible)) throw new InputError("Homepage favorites must reference visible reviews.");
    return id;
  });
  return { schemaVersion: 4, title: text(doc.title, "title", 200, true), items, favoriteIds };
}

export function validateGlobal(value: unknown): GlobalDocument {
  const doc = record(value);
  exactKeys(doc, ["schemaVersion", "title", "phone", "email", "formRecipientEmail", "socials"], "global settings");
  if (doc.schemaVersion !== 5) throw new InputError("Unsupported global settings version.");
  const phone = text(doc.phone, "phone", 40, true).trim();
  const digits = phone.replace(/\D/g, "");
  if (!/^\+?[0-9 ()\-\.]+$/.test(phone) || digits.length < 7 || digits.length > 15) throw new InputError("Enter a valid phone number, including country code outside the US.");
  const email = emailAddress(doc.email, "public email address");
  // Optional only for older snapshots. Never rewrite historical JSON while reading it.
  const recipient = Object.hasOwn(doc, "formRecipientEmail") ? { formRecipientEmail: emailAddress(doc.formRecipientEmail, "form recipient email address") } : {};
  if (!Array.isArray(doc.socials) || doc.socials.length > Object.keys(socialPlatforms).length) throw new InputError("Invalid social links.");
  const seen = new Set<string>();
  const socials = doc.socials.map(value => {
    const link = record(value);
    exactKeys(link, ["platform", "href"], "social link");
    if (typeof link.platform !== "string" || !Object.hasOwn(socialPlatforms, link.platform) || seen.has(link.platform)) throw new InputError("Choose each supported social platform only once.");
    const platform = link.platform as SocialPlatform;
    seen.add(platform);
    const href = text(link.href, "social URL", 2048, true);
    let url: URL;
    try { url = new URL(href); } catch { throw new InputError("Enter a full HTTPS social profile URL."); }
    if (/[\s\\\u0000-\u001f\u007f]/.test(href) || url.protocol !== "https:" || url.username || url.password || url.port ||
      !(socialPlatforms[platform].hosts as readonly string[]).includes(url.hostname) || url.pathname === "/") throw new InputError(`Use a direct HTTPS ${socialPlatforms[platform].label} profile URL.`);
    return { platform, href };
  });
  return { schemaVersion: 5, title: text(doc.title, "title", 200, true), phone, email, ...recipient, socials };
}

export function favoriteReviews(document: ReviewsDocument) {
  return document.favoriteIds.flatMap(id => {
    const item = document.items.find(review => review.id === id && review.visible);
    return item ? [{ id, name: item.name, quote: item.homeQuote || item.quote }] : [];
  });
}
export function orderedReviews(document: ReviewsDocument) {
  const favorites = new Set(document.favoriteIds);
  return [...document.favoriteIds.flatMap(id => document.items.filter(item => item.id === id && item.visible)),
    ...document.items.filter(item => item.visible && !favorites.has(item.id))];
}
