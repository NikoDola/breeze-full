import { getPublishedProof } from "@/lib/cms/public";
import CmsProofContent from "@/components/sections/CmsProofContent";
export async function generateMetadata() {
  const { document } = await getPublishedProof();
  return { title: document.seoTitle || document.title, description: document.seoDescription, robots: { index: false, follow: false } };
}
export default async function ProofPage() {
  const publication = await getPublishedProof();
  return <div data-cms-revision={publication.revisionId} data-cms-version={publication.version}>
    <CmsProofContent document={publication.document} />
  </div>;
}
