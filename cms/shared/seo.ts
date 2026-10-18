import { gallerySource } from "./additional-content";
import { validatePlacement, type ImageReference } from "./media";
import { InputError } from "./validation";

export type SocialImage = { ogImage?: ImageReference | null };

// Omission keeps historical documents unchanged; null explicitly removes an image.
export function validateSocialImage(document: Record<string, unknown>): SocialImage {
  if (!Object.hasOwn(document, "ogImage")) return {};
  if (document.ogImage === null) return { ogImage: null };
  if (typeof document.ogImage === "string") {
    if (!gallerySource.some(image => image.image === document.ogImage)) throw new InputError("Choose an approved site photo or an uploaded OG image.");
    return { ogImage: document.ogImage };
  }
  return { ogImage: validatePlacement(document.ogImage) };
}
