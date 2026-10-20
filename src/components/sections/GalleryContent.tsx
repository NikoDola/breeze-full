import Link from "next/link";
import PageHero from "./PageHero";
import CtaBandContent from "./CtaBandContent";
import { contentText as t, contentItems as items, type ContentRecord } from "../../../cms/shared/content";
import type { SiteData } from "@/lib/site";
import Gallery from "./Gallery";
import { mediaDelivery } from "@/lib/cms/media-delivery";
import type { ImageReference } from "../../../cms/shared/media";
import { contentDefinitions } from "../../../cms/shared/content";
const design = contentDefinitions["gallery"];
export default function GalleryContent({ content: c, site, preview = false, mediaOrigin, heroImage = design.image }: { content: ContentRecord; site: SiteData; preview?: boolean; mediaOrigin?: string; heroImage?: string }) {
  const shots = items(c, "photos").map(photo => {
    const image = photo.image as ImageReference, uploaded = typeof image !== "string";
    return { id: t(photo, "id"), caption: t(photo, "caption"),
      src: uploaded ? mediaDelivery(image, preview, false, mediaOrigin) : image,
      alt: uploaded ? image.alt : t(photo, "caption"),
      width: uploaded ? image.width : 900, height: uploaded ? image.height : 675,
      unoptimized: preview && uploaded };
  });

  return (
    <>
      <PageHero title={t(c, "heading")} eyebrow={t(c, "eyebrow")} tagline={t(c, "tagline")} icon={design.icon} image={heroImage} />

      <section className="gallery-section-1">
        <Gallery shots={shots} />

        <p className="gallery-copy-1">
          {t(c, "closing")}{" "}
          <Link
            href="/contact-us"
            className="gallery-link-1"
          >
            {t(c, "linkLabel")}
          </Link>
          .
        </p>
      </section>

      <CtaBandContent site={site} />
    </>
  );
}
