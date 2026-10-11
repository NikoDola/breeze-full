import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { testOrigin } from "./access";
import { workerOrigin } from "./worker";
import { CACHE_TAG, PAGE_ID, validateDocument, type Publication } from "../../../cms/shared/contract";
// Metadata and page rendering share one request, including when the fetch uses
// an AbortSignal (which opts out of Next's automatic fetch deduplication).
export const getPublishedProof = cache(async (): Promise<Publication> => {
  if (!testOrigin() || !process.env.CMS_WORKER_URL) notFound();
  const response = await fetch(`${workerOrigin()}/api/public/pages/${PAGE_ID}`, {
    cache: "force-cache", next: { tags: [CACHE_TAG], revalidate: 3600 },
    redirect: "error", signal: AbortSignal.timeout(10000),
  });
  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("Published content is temporarily unavailable.");
  const value = await response.json() as Publication;
  return { ...value, document: validateDocument(value.document) };
});
