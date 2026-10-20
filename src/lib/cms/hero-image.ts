import type { ImageReference } from "../../../cms/shared/media";
import { cmsImageSource } from "./images";
import { mediaDelivery } from "./media-delivery";

export function heroImageSource(image: ImageReference | null | undefined, fallback: string, preview = false, mediaOrigin?: string): string {
  if (!image) return fallback;
  return typeof image === "string" ? cmsImageSource(image) ?? fallback : mediaDelivery(image, preview, false, mediaOrigin);
}
