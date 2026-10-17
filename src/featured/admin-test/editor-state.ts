import type { EditorState } from "../../../cms/shared/contract";

export type Operation = "load" | "refresh" | "import" | "draft" | "publish" | "retry" | null;
type StatusInput = { state: EditorState | null; baseVersion?: number; dirty: boolean; operation: Operation; now: number };

export function editorStatus({ state, baseVersion, dirty, operation, now }: StatusInput) {
  const delivery = state?.delivery;
  const leaseActive = Boolean(delivery && !delivery.confirmed_at && delivery.lease_until > now);
  const deliveryFailed = Boolean(delivery?.last_error && !delivery.confirmed_at);
  const confirmed = Boolean(delivery?.confirmed_at);
  const deliveryLabel = confirmed ? "Visible on the website" : deliveryFailed ? "Website refresh failed" : leaseActive ? "Refreshing the website" : delivery?.invalidated_at ? "Awaiting page confirmation" : state?.publication ? "Website refresh pending" : "Website not updated yet";
  const deliveryDetail = confirmed ? "The published revision was confirmed on the public page." : deliveryFailed ? "Your publication is saved. You can safely retry delivery." : state?.publication ? "Your publication is saved while delivery completes." : "The public page updates after publication.";
  let label = "Draft saved — not published", detail = "Publish changes to update the website.", tone = "neutral";
  if (!state?.draft) { label = "No content yet"; detail = "Copy your existing content to start editing."; }
  else if (state.publication?.version === baseVersion && confirmed) { label = "Live on website"; detail = "This version is visible on the website."; tone = "success"; }
  if (deliveryFailed) { label = "Published · refresh failed"; detail = "Your publication is saved. Retry its website refresh below."; tone = "danger"; }
  else if (state?.publication && !confirmed) { label = "Published · refresh pending"; detail = "Your revision is saved. Website confirmation is pending."; tone = "warning"; }
  if (dirty) { label = "Unsaved changes"; detail = "Save a draft to keep your latest edits."; tone = "warning"; }
  if (operation) {
    const labels = { load: "Loading content…", refresh: "Refreshing status…", import: "Preparing your content…", draft: "Saving draft…", publish: "Publishing your draft…", retry: "Retrying website refresh…" };
    label = labels[operation]; detail = operation === "publish" || operation === "retry" ? "Saving and confirming delivery to the website." : "Please wait a moment."; tone = "neutral";
  }
  return { label, detail, tone, leaseActive, deliveryFailed, deliveryLabel, deliveryDetail };
}
