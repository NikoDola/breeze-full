import type { MediaPlacement } from "../../../cms/shared/media";
import { TEST_WORKER_ORIGIN } from "../../../cms/shared/contract";
// Provider URLs are derived here, never persisted in documents.
export function mediaDelivery(image: MediaPlacement, preview = false, thumbnail = false, origin = TEST_WORKER_ORIGIN) {
  return preview ? `/api/cms/media/${image.assetId}/${thumbnail ? "thumb" : "master"}`
    : `${origin}/media/${image.assetId}/${thumbnail ? "thumb" : "master"}-v1.webp`;
}
