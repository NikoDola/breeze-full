import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { cmsOrigin, cmsCacheTag, cmsProofEnabled } from "./scope";
import { workerOrigin } from "./worker";
import { PAGE_ID, validatePageDocument, type Publication, type PageId, type ProofDocument } from "../../../cms/shared/contract";
import type { HomeDocument } from "../../../cms/shared/home";
// Metadata and page rendering share one request, including when the fetch uses
// an AbortSignal (which opts out of Next's automatic fetch deduplication).
const getPublication = cache(async (pageId: PageId): Promise<Publication | null> => {
  // Unconfigured deployments retain the original source content.
  if (!cmsOrigin() || !process.env.CMS_WORKER_URL) return null;
  const response = await fetch(`${workerOrigin()}/api/public/pages/${pageId}`, {
    cache: "force-cache", next: { tags: [cmsCacheTag(pageId)], revalidate: 3600 },
    redirect: "error", signal: AbortSignal.timeout(10000),
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Published content is temporarily unavailable.");
  const value = await response.json() as Publication;
  return { ...value, document: validatePageDocument(pageId, value.document) };
});

export const getPublishedProof = cache(async (): Promise<Publication & { document: ProofDocument }> => {
  if (!cmsProofEnabled()) notFound();
  const publication = await getPublication(PAGE_ID);
  if (!publication || publication.document.schemaVersion === 2) notFound();
  return { ...publication, document: publication.document };
});

export const getPublishedHome = cache(async (): Promise<(Publication & { document: HomeDocument }) | null> => {
  const publication = await getPublication("home");
  if (!publication) return null; // Exact source baseline until the first publication.
  if (publication.document.schemaVersion !== 2) throw new Error("Invalid homepage publication.");
  return { ...publication, document: publication.document };
});
