import { additionalDefinitions, gallerySource } from "./additional-content";
import { services } from "../../src/lib/services";
import promotions from "../../src/content/promotions.json";
import { validatePlacement, type ImageReference, type MediaPlacement } from "./media";
import { exactKeys, InputError, record } from "./validation";

export type HeroImage = { heroImage?: ImageReference | null };
export type OfferHeroImages = Partial<Record<"winter-promotions" | "summer-promotions", ImageReference | null>>;
export const reviewsHeroImage = "/images/Why-We-Should-At-Home.jpg";
export const heroImageOptions = [...new Map([
  ...gallerySource.map(photo => ({ label: photo.caption, source: photo.image })),
  ...services.map(service => ({ label: service.title, source: service.image })),
  ...Object.values(additionalDefinitions).filter(page => page.image).map(page => ({ label: page.label, source: page.image })),
  ...promotions.items.map(offer => ({ label: offer.title, source: offer.image })),
  { label: "Going green", source: "/images/mass-energy-audit.png" },
].map(image => [image.source, image])).values()];

function validateReference(value: unknown): ImageReference | null {
  if (value === null) return null;
  if (typeof value === "string") {
    if (!heroImageOptions.some(image => image.source === value)) throw new InputError("Choose an approved site photo or an uploaded hero image.");
    return value;
  }
  return validatePlacement(value);
}

// Omission leaves historical snapshots intact; null restores the original hero.
export function validateHeroImage(document: Record<string, unknown>): HeroImage {
  return Object.hasOwn(document, "heroImage") ? { heroImage: validateReference(document.heroImage) } : {};
}

export function validateOfferHeroImages(document: Record<string, unknown>, pageId: string): { offerHeroImages?: OfferHeroImages } {
  if (!Object.hasOwn(document, "offerHeroImages")) return {};
  if (pageId !== "promotions") throw new InputError("Seasonal hero images belong to Promotions.");
  const images = record(document.offerHeroImages);
  exactKeys(images, ["winter-promotions", "summer-promotions"], "seasonal hero images");
  return { offerHeroImages: Object.fromEntries(Object.entries(images).map(([id, image]) => [id, validateReference(image)])) };
}

export function heroAssets(document: HeroImage & { offerHeroImages?: OfferHeroImages }): MediaPlacement[] {
  return [document.heroImage, ...Object.values(document.offerHeroImages ?? {})].filter((image): image is MediaPlacement => Boolean(image && typeof image !== "string"));
}
