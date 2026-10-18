import "server-only";
import type { Metadata } from "next";
import type { ImageReference } from "../../../cms/shared/media";
import { cmsImageSource } from "./images";
import { mediaDelivery } from "./media-delivery";
import { workerOrigin } from "./worker";

export function pageMetadata(title: string, description: string, ogImage?: ImageReference | null): Metadata {
  if (!ogImage) return { title, description };
  const image = typeof ogImage === "string"
    ? { url: cmsImageSource(ogImage)!, alt: title }
    : { url: mediaDelivery(ogImage, false, false, workerOrigin()), width: ogImage.width, height: ogImage.height, alt: ogImage.alt };
  return {
    title,
    description,
    openGraph: { title, description, type: "website", locale: "en_US", images: [image] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}
