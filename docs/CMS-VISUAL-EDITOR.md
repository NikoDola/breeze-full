# Visual editor: first slice

The homepage heading fields now use a compact Tiptap toolbar on `cms-testing`.
See [CMS-RICH-TEXT.md](CMS-RICH-TEXT.md) for the versioned content contract,
security limits, state handling, tests and compatible rollout requirements.

## Current admin shell

The admin is a simple client control panel, not a marketing page. Do not add
promotional panels, slogans or feature lists. Before authentication, show only
necessary sign-in, navigation, help and error controls; do not describe admin
capabilities, available content or internal details. See `codex.md`.

### Sign in

`/admin` and `/admin-test` redirect signed-out visitors to `/admin-test/login`.
The simple, centered sign-in form replaces the browser's Basic-auth dialog.
It uses the existing environment's admin username/password, with inline errors,
password visibility and a support link. The editor's top bar includes Sign out,
which respects its existing unsaved-change and busy-state checks.

`POST /api/cms/session` checks the exact configured host/origin, the editor request
header and the existing distributed limiter before checking credentials. It
issues an eight-hour, signed HttpOnly cookie, SameSite=Strict and Path=/; HTTPS
uses Secure and the `__Host-` cookie prefix. Signing keys are derived from the
current credentials, write token and deployment scope, so credential rotation
invalidates existing sessions. No new environment variables or SQL migrations
are needed. Credentials are never stored in browser application storage.

`DELETE /api/cms/session` sets an unauthenticated sign-out marker, preventing
previously cached Basic credentials from overriding logout. Session cookies take
precedence over legacy explicit Basic headers retained for existing proof tools.
API authentication failures return JSON without `WWW-Authenticate`; the protected
preview still refuses unauthenticated access. Sessions are stateless: logout
clears access in that browser; rotating credentials revokes all issued sessions.

### Workspace

The editor now uses a compact, professional shell adapted from the existing
Brzio admin UI in `Desktop/Junk code/brzio`. It has restrained typography,
local surface/accent tokens, simple cards and a 240px desktop sidebar. The
sidebar lists Homepage under Pages; extend the
`navigation` registry in `AdminShell.tsx` for future admin destinations.

CMS proof is temporarily disabled for normal use. It returns 404 and cannot be
edited, published, retried or invalidated through Next's APIs. Requests without
a page ID target Homepage. Existing proof content/history/media remain stored.
The proof can be explicitly restored for Preview/local testing with
`CMS_PROOF_ENABLED=true`; Production remains disabled regardless of that flag.
The isolated `cms:proof` harness retains its test-only access and explicitly
targets `pageId=cms-proof` so it can never fall back to editing Homepage.

The top bar contains Leave admin with a left arrow. At 900px and below, the
sidebar becomes a burger-triggered native dialog with keyboard focus trapping,
Escape/backdrop dismissal, and focus restoration. Switching pages or leaving
asks before discarding unsaved changes; navigation is blocked during saves,
publishing and uploads. Save/publish actions remain visible at the bottom and
respect the sidebar width.

The public header/footer belong to `src/app/(site)/layout.tsx`; all public URLs,
metadata and page content remain the same. The shared root only supplies HTML,
fonts and metadata. Admin pages render without the public shell. The protected
homepage preview shows the complete website shell in a protected iframe. Global
settings uses that iframe's contact-area mode, starting with the footer and
offering the homepage header, hero, service request and footer as separate areas.
Global draft values flow through the preview's site context to the shared public
contact renderers and footer socials. No backend, credential,
publication or cache configuration changes are involved in this UI update.

The production HTTP proof checks the admin/public-preview separation alongside
the existing draft, publish, retry and cached content workflow. The historical
notes below describe earlier editor/media slices; current R2 behavior is in
`CMS-MEDIA.md` and client deployment details are in `CMS-CLIENT-LAUNCH.md`.

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
- The toolbar shows Save draft and Publish changes. **Check status** appears only
  in an error message and preserves unsaved edits. If a newer saved draft exists, saving
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
