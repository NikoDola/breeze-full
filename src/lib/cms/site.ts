import "server-only";
import { cache } from "react";
import { site, withGlobalSettings } from "@/lib/site";
import { getPublishedGlobal } from "./public";

export const getSite = cache(async () => {
  const publication = await getPublishedGlobal();
  return publication ? withGlobalSettings(publication.document) : { ...site, socials: [] };
});
