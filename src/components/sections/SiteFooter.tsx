import { getSite } from "@/lib/cms/site";
import { getPublishedGlobal } from "@/lib/cms/public";
import SiteFooterContent from "./SiteFooterContent";

export default async function TemplateFooter() {
  const [site, publication] = await Promise.all([getSite(), getPublishedGlobal()]);
  return <SiteFooterContent site={site} publication={publication} />;
}
