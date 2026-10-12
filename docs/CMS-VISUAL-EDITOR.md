# Visual editor: first slice

The `/admin-test` interface now edits the existing version-1 CMS document through
`/api/cms/editor`. D1 tables, Worker endpoints, API contracts, cache tags, OIDC/HMAC
delivery, access checks, and deployment configuration are unchanged.

## Editing experience

- A responsive workspace with Content, Images, and Page details tabs.
- Content fields: eyebrow, headline, description, button text/destination, and
  bottom note. Existing limits and shared document validation still apply.
- Page title, SEO title, and SEO description remain available.
- A visible action toolbar shows loading, unsaved changes, draft saving,
  publishing, published delivery, and pending/failed cache refresh independently.
- Save draft keeps edits private. Publish operates on a saved, current draft;
  unsaved or stale edits disable publication. Duplicate clicks are guarded.
- A persistent bottom action bar keeps **1. Save draft** and **2. Publish draft**
  visible while scrolling through fields, including on mobile. It shares the
  toolbar's action handlers and disabled states, and shows saving/error feedback.
- Refresh status preserves unsaved edits. If a newer saved draft exists, saving
  and publishing are blocked until the user explicitly loads the latest version.
  Discarding edits asks for confirmation; leaving with unsaved edits warns.
- Existing manual **Retry cache refresh** remains available after interrupted or
  failed delivery. It does not create a new revision. The button respects the
  active lease and becomes available when its 90-second lease expires.

## Preview and images

The live preview uses the same `CmsProofContent` renderer as `/cms-proof`, with
container-responsive typography and desktop/tablet/mobile width controls. Draft
preview updates as the user types. Published preview reads the immutable snapshot
returned by the existing editor API and states whether delivery is confirmed.
Preview CTA buttons do not navigate away from edits.

Images are still stored as `images: string[]`. The UI supports selecting from a
small list of existing Breeze assets, adding/editing an image address, reordering,
and removing a reference. At most 12 references are allowed by the existing model.
Removal never deletes the underlying file. No upload or storage API was added.

Safe references can render from `/images/` or `/template-2/`, bare legacy filenames
(resolved under `/images/`), or HTTPS without embedded credentials. Unsupported
protocols/paths are not rendered. Missing files show an unavailable placeholder;
their stored references remain intact. Local images use Next Image optimization;
remote images load directly in the browser without server optimization or an
expanded remote-host allowlist. Images are lazy loaded. The renderer treats them
as decorative because per-image alt text is not part of the current data model;
descriptive alt text belongs in the future media/schema slice.

One image renders normally. Multiple images use an accessible manual slider with
previous/next buttons, keyboard arrows, and a position indicator. There is no
autoplay. Only the current slide loads. Text/CTA/notes render on the server for
published pages; image interaction is a small client component.

## Files and checks

- `src/featured/admin-test/Editor.tsx`, `editor-state.ts`, and CSS module: editor
  states, existing API actions, tabs, preview controls, and publishing status.
- `src/featured/admin-test/ImageEditor.tsx` and `images.module.css`: reference
  selection, edit, order, and removal.
- `src/components/sections/CmsProofContent.tsx`, `CmsImage.tsx`,
  `CmsSectionImages.tsx`, and `cms-proof.module.css`: shared rendering.
- `src/lib/cms/images.ts`: render-only safe reference resolution and site assets.
- `workers/cms/tests/editor.test.mjs`: focused status/lease/image safety cases,
  included by the existing Worker test command's test glob.

Verification: TypeScript checking, seven focused editor tests, and the existing
local production-build proof of draft privacy, publish/invalidate/confirm, and
zero origin reads on cached requests. No full remote benchmark, remote database
write, resource change, or production deployment was performed for this slice.
The local proof only reads the existing public legacy endpoint and uses an
isolated workerd/D1 database. The visual appearance is for user review; no automated
browser check was run.

Next slices remain controlled layouts, image metadata/R2, page creation, blog
routes, and production authentication. The homepage hero and actual contact form
remain developer-controlled.
