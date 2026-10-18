import "server-only";
import { cache } from "react";
import { getContentPage } from "./public";
import { serviceLabels } from "../service-labels";
import { contentDefinitions, contentText, contentItems, type ContentPageId } from "../../../cms/shared/content";
import { getSite } from "./site";
import { pageMetadata } from "./metadata";

export const getServiceSummaries = cache(async () => Promise.all((Object.keys(serviceLabels) as (keyof typeof serviceLabels)[]).map(async slug => {
  const { document, publication } = await getContentPage(slug), content = document.content;
  return { slug, title: contentText(content, "heading"), tagline: contentText(content, "tagline"), blurb: contentText(content, "summary"), icon: contentDefinitions[slug].icon, image: contentDefinitions[slug].image, revisionId: publication?.revisionId, version: publication?.version };
})));
export async function contentMetadata(pageId: ContentPageId, offerSlug?: string) {
  const { document } = await getContentPage(pageId);
  if (offerSlug && pageId === "promotions") {
    const offer = contentItems(document.content, "offers").find(item => item.id === offerSlug)!;
    return pageMetadata(contentText(offer, "heading"), contentText(offer, "seoDescription"), document.ogImage);
  }
  const site = await getSite();
  return pageMetadata(document.seoTitle, document.seoDescription.replaceAll("{phone}", site.phone).replaceAll("{email}", site.email).replaceAll("{address}", site.addressLine), document.ogImage);
}
