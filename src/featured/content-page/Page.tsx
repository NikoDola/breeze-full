import ContentPageView from "@/components/sections/ContentPageView";
import { getContentPage } from "@/lib/cms/public";
import { getServiceSummaries } from "@/lib/cms/content";
import { getSite } from "@/lib/cms/site";
import { contentDefinitions, type ContentPageId } from "../../../cms/shared/content";
import { workerOrigin } from "@/lib/cms/worker";
import { cmsOrigin } from "@/lib/cms/scope";

export default async function ContentPage({ pageId, offerSlug }: { pageId: ContentPageId; offerSlug?: string }) {
  const needsServices = contentDefinitions[pageId].group === "HVAC" || pageId === "services" || pageId === "why-choose-breeze";
  const [{ document, publication }, site, services] = await Promise.all([getContentPage(pageId), getSite(), needsServices ? getServiceSummaries() : Promise.resolve([])]);
  return <div data-cms-page={publication ? pageId : undefined} data-cms-revision={publication?.revisionId} data-cms-version={publication?.version}><ContentPageView document={document} site={site} services={services} offerSlug={offerSlug} mediaOrigin={cmsOrigin() ? workerOrigin() : undefined} /></div>;
}
