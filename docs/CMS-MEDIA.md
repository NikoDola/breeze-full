# R2 media library — test environment

Implemented on `cms-testing`, 2026-10-13. Read this alongside
`CMS-HOMEPAGE-MIGRATION.md` and `CMS-SOL-HANDOFF.md`.

## Using the library

Open the branch Preview `/admin-test`, select **CMS proof**, then **Images**.
Upload JPEG, PNG, WebP or AVIF files (10 MB, 24 MP, maximum 8192 pixels per side,
still images only). The editor shows upload progress and validation status.
Select an uploaded image, edit its description or mark it decorative, then
**Save draft** and **Publish draft**. Images can be replaced, removed or reordered.
The existing proof supports a slider. The homepage and its artwork are unchanged.

Search is paginated (24 records per page). Library descriptions are defaults for
future selections; page descriptions belong to each placement and revision.
Removing a placement never deletes its files. The current interface deliberately
has no permanent-delete operation. Failed validation can be retried after the
90-second processing lease; rejected files require a new upload.

## Test resources and isolation

- Worker: `breeze-test-api`; D1: `breeze-test-db`.
- Private R2 Standard bucket: `breeze-test-assets`, binding `MEDIA`.
- Public `r2.dev` access is disabled; no public bucket domains.
- Worker media URLs are the approved delivery origin for this slice. A dedicated
  media custom domain can be configured later without changing asset IDs.
- The checked-in Worker defaults to writes disabled. Deployment uses the existing
  explicit test-only override after preflight. No production bindings are used.
- No new paid service/subscription, Vercel bypass credential, queue or Redis store.

New Worker setting: `CMS_UPLOAD_ORIGIN` (the exact branch Preview origin; override
with the exact localhost origin in local `.dev.vars`). Existing Next variables
and `CMS_WRITE_TOKEN` remain unchanged. No new browser-visible credential or
`NEXT_PUBLIC_` variable is required. R2 is accessed through its Worker binding.

## Upload and validation

1. Protected Next `POST /api/cms/media` requests a scoped upload grant from the
   Worker. D1 stores only its SHA-256 hash. Expiration is five minutes.
2. Browser `PUT /api/media/upload/:assetId` sends bytes to the Worker with the
   one-use grant. Exact Origin, test/write gate, declared size, actual bounded
   byte count and file signature are checked. A claimed grant cannot be replayed.
3. Original bytes enter the private bucket. Maximum buffering is bounded to
   10 MB input; no image decoding happens in the Worker runtime.
4. Next claims a 90-second validation lease and fetches the original server-side.
   Sharp decodes pixels with strict errors and pixel/channel/frame limits,
   applies orientation, strips metadata, and writes WebP delivery copies to R2.
5. Completion requires all copies to exist. Retries reuse immutable object keys;
   different bytes cannot overwrite them. A lost completion response is checked
   against fresh state before reporting failure.

Originals remain unchanged and private. Delivery master uses quality 92; a 360px
thumbnail and a maximum 1600px private preview are stored once. Private previews
are capped below Vercel's 4.5 MB response limit. Large browser upload bodies never
pass through a Vercel function. Validation responses contain only small JSON.

Grant limits are enforced inside D1 transactions: 30/hour, 200/day, 5000 assets
and 5 GB reserved original bytes per test installation. These conservative quotas
include failed reservations; developer review is needed if a test hits them.
CORS applies only to the capability upload route. All Worker admin routes still
require the server credential and reject browser Origin headers.

## Schema and revisions

Additive migration `0003_media.sql` creates:

- `media_assets`: identity, immutable object keys/checksum/dimensions, original
  size/type/name, status, validation lease, default description and timestamps.
- `media_upload_sessions`: hashed capability, exact origin, expiry, one-use state.
- `revision_assets`: immutable, indexed revision-to-asset references.

Version 1 proof documents and version 2 homepage documents retain their readers.
Version 3 proof documents allow existing string paths plus placements containing
`assetId`, `alt`, `decorative`, `width`, `height`. Editing image selections upgrades
only that draft to version 3. Historical JSON is never rewritten.

The Worker validates asset readiness and dimensions on save/publish. D1 triggers
recheck media and capture references in the same publication transaction as the
snapshot, public pointer and outbox. Failed publication rolls back media exposure.
Failed Next cache delivery preserves the publication and permits the existing
manual retry without duplicate revisions. Ready asset bytes and published
references are immutable; referenced files cannot be deleted through D1.

## Endpoints

| Route | Purpose |
| --- | --- |
| Next `GET /api/cms/media?q=&offset=` | Authenticated library |
| Next `GET /api/cms/media/health` | Read-only binding/schema preflight |
| Next `POST /api/cms/media` | `grant`, `validate`, `metadata` actions |
| Next `GET /api/cms/media/:id/thumb` or `/master` | Protected no-store thumbnail or bounded preview |
| Worker `PUT /api/media/upload/:id` | Narrow one-use capability upload |
| Worker `GET /media/:id/master-v1.webp` or `/thumb-v1.webp` | Published images only |
| Worker `/api/admin/media` | Protected list, grant, metadata and health |
| Worker `/api/admin/media/:id/{claim,source,master,thumb,preview,complete,fail}` | Server-only validation protocol |

## Rendering and caching

`src/lib/cms/media-delivery.ts` derives URLs from asset IDs; `CmsImage` is the
rendering adapter. Replacing Vercel optimization with a custom Cloudflare loader
does not require document or database changes. No temporary URLs are persisted.

Published WebP masters are served by the Worker only when a retained published
revision references the asset. Worker Cache API stores successful responses with
one-year immutable caching. Private and error responses use no-store. Existing
published media stays public even after removal from a later revision.

Next Image negotiates AVIF/WebP for published images. Remote sources are pinned
to the test Worker `/media/` prefix, query strings are disallowed, and redirects
are disabled. Authenticated draft previews bypass the public optimizer. Source
URLs change on replacement; the existing Next content invalidation flow updates
the page reference. Cache eviction/new sizes can legitimately refetch the source.

Local integration tests explicitly allow their loopback Worker origin in the
optimizer. That option requires `CMS_LOCAL_PROOF_BUILD` and is disabled on Vercel.

## Verification and operations

- `npm run cms:check`: decoder, real local D1/R2, grant auth/origin/expiry/replay,
  signatures, private delivery, atomic publishing, retry and history retention.
- `npm run cms:proof`: isolated Next production build, all four formats including
  a >4.5 MB upload, authenticated previews, invalid decode, responsive AVIF/WebP,
  publication/invalidation and cached responses. Restores prior test content.
- Refresh development OIDC with Vercel CLI into ignored `.local/cms-media-oidc.env`.
- `node workers/cms/tests/media-preview-proof.mjs --preflight`: verify the Preview
  and storage with writes disabled.
- `node workers/cms/tests/media-preview-proof.mjs --publish`: focused remote test;
  restores the prior proof publication and any separate draft, retains the test
  image in history, and leaves the homepage unchanged. Uses existing ignored
  `.local/cms-preview.env` credentials. Reports and recovery snapshot are ignored.

An ignored export of the test D1 database was made before migration. Existing
rows and history are preserved. Ongoing automated backup/restore scheduling and
30-day orphan deletion remain operational follow-ups: this slice never deletes
existing files or historical data. Stale failed uploads can be inspected and
retained safely; no automatic R2 lifecycle rule is enabled.

Public-site CSS, the homepage hero, form implementation and homepage schema are
unchanged. Production authentication, migration of additional page image fields,
permanent deletion and switching optimization provider remain separate work.

## Verified results — 2026-10-13 (Europe/Skopje)

- Implementation commit: `ec35398` on `cms-testing`.
- Next production build and local D1/R2/Next integration passed. The CMS suite
  passed 29 tests, including the original publishing and homepage regressions.
- Private bucket verified: `r2.dev` disabled and no public bucket custom domains.
- Migration applied only to `breeze-test-db`, after an ignored pre-migration export.
  D1 initially rejected a multi-statement validation trigger; its transaction
  rolled back completely. Separate validation/capture triggers then applied.
- Preview: `https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app`.
  Deployment `dpl_4bYFF4G1mU27CNKZQcNnWnhtCgZS`, Ready, `iad1`.
- Final test Worker version: `4132d527-cdfc-470d-a078-fa301e121f83`.
  Writes were enabled only after the new Preview's OIDC/HMAC/credential/storage
  preflight passed with writes disabled.
- Real Preview uploads passed for JPEG, PNG, WebP and AVIF, including a PNG above
  4.5 MB. Authenticated no-store previews passed; draft public URLs returned 404;
  missing authentication and wrong origins were rejected. Fake JPEG pixel data
  was rejected by Sharp on Vercel.
- Draft → immutable publication → Next invalidation → confirmed HTML passed.
  Publish-to-visible was **2.74 seconds in this single acceptance run**.
- Responsive AVIF at 384px and WebP at 960px were returned; repeated requests
  reported `x-vercel-cache: HIT`. Synthetic test images verify format/size/cache
  behavior, not representative photo compression or median/p95 performance.
- Deployment ID was unchanged across publishing. All **13 pre-existing revision
  rows remained identical**; only the media test and restoration revisions were
  added. Previous proof publication/draft restored, homepage revision unchanged.
  The test image remains available through its immutable historical revision.
- Local production-mode cache checks recorded zero Worker content requests for
  five cached proof requests and three cached homepage requests. Remote origin
  request counts and the old full performance benchmark were not repeated.

Raw reports, history snapshots, test images and credentials are excluded from Git.
Verification used HTTP integration tests; visual browser acceptance remains with
the user. No production resources, security settings or `main` commits changed.
