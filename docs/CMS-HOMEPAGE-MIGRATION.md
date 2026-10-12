# Homepage migration — version 2

This slice migrates only `/` on `cms-testing`, using `breeze-test-api` and
`breeze-test-db`. Production and all version-1 historical revisions remain
unchanged. Read this document after `CMS-SOL-HANDOFF.md`; it supersedes that
handoff's original proposal for generic layouts and an about-page pilot.

## Content mapping

| Existing component | Editable content | Developer-controlled structure and behavior |
| --- | --- | --- |
| `HeroSection` | None | Entire original component, images, animations and copy |
| `SeasonsSection` | Heading lines and emphasized text, introduction, cooling/heating card titles, labels, descriptions and link labels | Two cards in the same order; icons, HTML, CSS, service selection and `#contact` links |
| `ContactSection` | Heading and emphasized text, introduction, phone prompt | Actual `ServiceRequestForm`, validation, submission, phone number/link and icon from shared business data |
| `ReviewsSection` | Heading, emphasized line, introduction; array of names and quotes with stable IDs | Existing card markup, stars, typography and responsive grid |
| `AreaSection` | Heading and emphasized text, description, map link label, validated Google Maps URL, accessible iframe title and map location | Existing last-section position, map iframe attributes, layout and CSS |

All original copy comes from `cms/shared/home-seed.ts`, captured from commit
`5b40373fc78403c689d82550d9ca7067e2f97bdd`. The import records that source ID.
Heading line breaks and emphasis remain in the original React components. Normal
spaces before emphasized inline text are handled by the components. Homepage
metadata, canonical configuration, header, footer and other pages are unchanged.
These four sections have no editable photographs; image uploads are deferred.

## Data contract and compatibility

No SQL migration is required. Existing `cms_pages`, `cms_drafts`, `cms_revisions`,
`cms_imports` and `cms_publish_outbox` already store per-page JSON documents.
The new page has ID `home`, slug `""`, and public path `/`.

```text
schemaVersion: 2
template: breeze.home
templateVersion: 1
title: Homepage
slots:
  seasons: { type: breeze.seasons, version: 1, content: ... }
  contact: { type: breeze.contact-intro, version: 1, content: ... }
  reviews: { type: breeze.home-reviews, version: 1, content: ... }
  area:    { type: breeze.area, version: 1, content: ... }
```

`cms/shared/home.ts` is the field registry and strict validator. It defines
labels, limits, text controls, repeated groups, fixed card IDs and allowed
component versions. Unknown fields/slots, unsupported versions, reordered service
cards, duplicate IDs and unsafe map URLs are rejected. React escapes all text;
CMS documents cannot inject markup, scripts, form definitions or CSS.

The same registry generates controls in `HomeFields.tsx`. Existing section
components receive typed `content` props. `HomeContent.tsx` composes those same
components in their original order for the server-rendered homepage and the
responsive editor preview. There is no generic page builder renderer.

Version 1 remains readable and editable at `/cms-proof`. Its stored JSON is never
upgraded in place. Importing either page is idempotent and never overwrites drafts.
The homepage import uses the server's approved seed, ignoring browser source JSON.

## API and publishing

The existing API now accepts a validated `pageId` (`home` or `cms-proof`). Omitted
IDs still select `cms-proof` for compatibility with existing integrations.

| Endpoint | Homepage usage |
| --- | --- |
| `GET /api/public/pages/home` (Worker) | Published immutable snapshot only; 404 before first publication |
| `GET /api/admin/proof?pageId=home` (Worker) | Protected fresh draft/publication/delivery state |
| Existing Worker POST import/draft/publish/claim/ack endpoints | Include `pageId: "home"` in the existing body |
| `GET /api/cms/editor?pageId=home` (Next) | Editor state through the protected server bridge |
| `POST /api/cms/editor` (Next) | Existing actions plus `pageId: "home"` |
| `POST /api/cms/revalidate` (Next) | Signed event must match the server's page/path allowlist |

Draft saves retain optimistic version checks. Publishing atomically writes the
immutable revision, public pointer and outbox job. Lease claims, acknowledgments
and superseded-job completion are scoped to the selected page. A homepage retry
cannot acknowledge a proof job. Failed delivery preserves the publication and
retries the same revision instead of publishing another copy.

Next still owns invalidation and HTML verification. Revision, version and page
identity must appear together on a real HTML element. Homepage markers are data
attributes on the existing Seasons section; no visible wrapper is added.

## Cache and isolation

- Home cache tag: `cms:preview:cms-testing:page:home`.
- Proof cache tag: `cms:preview:cms-testing:page:cms-proof`.
- Tagged `force-cache` data fetching and 3600-second ISR remain enabled.
- React request memoization shares the fetch. No public client fetch or skeleton.
- Draft saves do not invalidate published HTML. Publication uses immediate tag
  expiration and revalidates only the allowlisted page path.
- Before first publication, the homepage renders the exact original seed.
  Fetch errors after publication are not silently converted into seed content.
- Production and unrelated Preview branches do not fetch this test content.
  Existing branch/origin/Worker pins and production rejection remain enforced.
- Worker receives only its own write token. OIDC and HMAC stay in Next.
- No new environment variables, SQL tables, Cloudflare resources or R2 settings.

The authenticated, no-store `/admin-test/preview` iframe uses the real website
CSS at desktop/tablet/mobile viewport widths. Only this route allows same-origin
framing. Other editor routes retain `frame-ancestors 'none'`. Messages require
the exact same origin and parent/frame identity. Navigation and submission are
disabled inside the editor frame; the public site's behavior is unchanged.

## Verification

`npm run cms:check` covers version validation, exact original section markup,
unchanged hero/form/public CSS hashes, v1 compatibility, immutable publishing,
cross-page isolation and safe retry. The baseline fixture was captured before
component edits; do not regenerate it to hide an unintended design change.

`npm run cms:proof` builds and starts a real isolated production-mode Next server
with local workerd/D1. It checks draft privacy, first publication over the cached
homepage fallback, HTML verification, cache hits without Worker requests, original
content restoration, unchanged proof publication and unchanged build ID. It also
checks protected preview-frame access. It does not modify remote D1.

Browser visual acceptance belongs to the client. The exact markup/hash checks
verify structural preservation; no claim of a pixel-by-pixel browser comparison
is made. Do not rerun the full remote performance benchmark for this slice.

## Using the Preview

1. Open the branch Preview's `/admin-test` with the existing test access.
2. Select **Homepage** (the default). If uninitialized, choose **Copy existing content**.
3. Pick Heating & cooling, Contact introduction, Reviews or Service area.
4. Edit content and inspect desktop/tablet/mobile live previews. Required fields
   must be complete; otherwise the preview retains its last valid content.
5. **Save draft** preserves the current public page. **Publish draft** updates it.
6. Wait for the confirmed delivery status, then use **Open published page**.
   If delivery fails, use **Retry cache refresh** after any active lease expires.

The original CMS proof is still available in the selector. Other pages, layouts,
image management, authentication and production access require later approval.

## Next developer instructions

Stay on `cms-testing`. Extend component-specific registries and renderer bindings
only after inspecting the next approved page. Preserve old document readers and
immutable history. Additive SQL is needed only when the persistence requirements
actually change. Keep server page/path/cache-tag allowlists in sync and retain
page ownership on every delivery query. Never accept arbitrary purge paths or
browser-selected Worker/database credentials. Obtain approval before migrating
another page or changing production.
