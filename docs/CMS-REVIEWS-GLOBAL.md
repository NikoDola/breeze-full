# Reviews library and Global settings

## Editing

2026-10-15 local extension: Global also owns business address, Google Maps directions
and shared contact-banner/service-callout copy. Reviews includes Client page headings
and search settings. These are optional additions to schemas 5 and 4; older snapshots
retain their source defaults. Global adds Contact location and Contact banner preview
areas. Reviews previews its real Client layout and homepage favorites. See
`CMS-REMAINING-PAGES.md` for local status and the required compatible release order.

Open `/admin-test` and choose **Reviews** or **Global settings** in the sidebar.
On first use, **Copy existing content** initializes a draft without publishing.
Use **Save draft**, then **Publish draft**. Existing status indicators, conflict
handling, unsaved-change warnings and **Retry cache refresh** apply to both.

Reviews supports 50 entries within the existing 48 KiB request limit. Add genuine
client reviews, edit their name/full text, optionally supply an original-wording
homepage excerpt, hide/remove an entry, and choose up to three homepage favorites.
Favorites can be reordered. Hiding/removing a favorite removes that selection.
No favorites hides the homepage review section; Client still shows other visible
reviews. Favorites appear first on `/reviews`, followed by the remaining entries.
Both views reuse the original ReviewCard component and CSS. Homepage headings and
introduction remain in Homepage; its old inline review fields remain in historical
documents but are superseded by the published Reviews library.

Global controls the business phone, public email, separate form-recipient email,
and footer social profiles. Public email is used for contact links and metadata;
the form recipient is used by service requests and careers applications. Global
settings previews only contact placements in the protected desktop/tablet/mobile
iframe. Choose Footer, Header, Hero or Service request; Footer appears first.
Contact location and Contact banner are also available for the new shared fields,
using the same public components. Draft
contact details and social links update without saving or publishing. Published
uses the selected Global publication. Incomplete fields keep the last valid preview.

Existing forms still open the visitor's mail application, so the recipient is visible there
and in browser data; this is not a private server-side mail delivery system.
Supported
platforms: Facebook, Instagram, YouTube, LinkedIn, TikTok and X. Each platform can
appear once. Only direct HTTPS profile URLs on approved platform hosts are accepted.
The approved source defaults are `https://www.facebook.com/breezehc/` and
`https://www.instagram.com/breeze_heating_and_cooling_/`. New Global imports use
these profiles. Existing documents retain their own links; an empty published
list deliberately hides socials. The footer renders accessible outline platform
icons in a separate `.footer-socials` row below both phone and email. The outlines
use navy `#071d30` and their backgrounds use the tagline color `#a7c2cb`.
Admin developer-support contact details remain separate.

Phone and email icons are part of the custom brand design and remain controlled
by project code/assets and developer-maintained styles. Clients can edit contact
text only; the CMS has no controls for replacing, removing or styling these icons.
Global documents store no icon artwork, asset references or CSS overrides. Both
Next and Worker reject extra icon/style fields before saving to D1 (SQLite).
The existing schema already enforces this, so no database cleanup or migration
is required.

## Storage and compatibility

No SQL migration is required. Two additive documents reuse `cms_pages`,
`cms_drafts`, `cms_revisions`, `cms_imports` and `cms_publish_outbox`:

| Page ID | Unique stored slug | Schema | Fields | Verification route |
| --- | --- | --- | --- | --- |
| `reviews` | `reviews` | 4 | `title`, `items[{id,name,quote,homeQuote,visible}]`, ordered `favoriteIds` | `/reviews` |
| `global` | `__global` | 5 | `title`, `phone`, `email`, optional `formRecipientEmail`, `socials[{platform,href}]` | `/` |

`cms/shared/collections.ts` defines types, strict field/size validators, safe social
hosts and public selection helpers. `collection-seeds.ts` imports all 15 original
full testimonials, preserving current published homepage excerpts and additional
homepage reviewers. If a legacy home has over three featured reviews, all are
preserved in the library and the first three are initially favorites. Duplicate
names get separate IDs. Imports are idempotent and do not overwrite drafts.
Schemas 1/2/3 and immutable historical revisions remain readable and unchanged.
The additive `formRecipientEmail` field is optional for compatibility with existing
schema-5 snapshots. Absent values use that snapshot's public email. New imports
store both explicitly; editing the public email in the admin pins the previous
recipient so it does not change unintentionally. Both fields are independently
validated in Next and the Worker. No migration or historical rewrite is required.
The recipient split passed all 52 CMS tests, lint, TypeScript and an isolated
production build. Test output: `.local/form-recipient-tests.log` and
`.local/form-recipient-build.log`. Existing published email values were not changed.

## APIs and security

The existing protected `/api/cms/editor?pageId=reviews|global` routes reuse the
same import/draft/publish/retry/preflight actions. The Worker uses the existing
`/api/admin/{proof,import,draft,publish,delivery/claim,delivery/ack}` endpoints and
page IDs. New public read endpoints are `/api/public/pages/reviews` and
`/api/public/pages/global`; they return only the currently published revision.

Both Next and Worker validate documents independently. Unsupported fields, unsafe
URLs, duplicate IDs/platforms, invalid or hidden favorite references, and oversized
requests are rejected. Text is escaped by React, never rendered as raw HTML.
Phone links are derived from validated digits; email addresses are safely encoded
for mailto links. Existing Basic authentication, CSRF/origin checks, throttling,
environment pinning, write credentials and OIDC delivery isolation remain intact.

Publication still atomically commits an immutable revision, its public pointer
and outbox event. Version checks prevent overwriting another editor. Retries
reuse the revision. Removing an item affects a new draft/publication only, not
historical data. No new credentials or environment variables are required.

## Rendering and caching

Public data remains server-fetched with `force-cache`, environment-specific tags
and the existing one-hour fallback revalidation. No browser content fetch is added.
Reviews invalidation expires its tag and refreshes both `/reviews` and `/`.
Global invalidation expires its tag and revalidates the root layout, covering all
public pages. Contact metadata also uses published values. Footer and Client review
elements carry publication markers used by the existing delivery verifier.

`getSite()` supplies cached globals to server components. PublicLayout supplies
the same values through SiteContext to the header and form email handlers.
The Global preview reuses the public header, HeroSection, ContactSection and
SiteFooterContent without duplicating the website's layouts. Homepage HeroSection
keeps its developer-controlled markup/artwork; only its
phone data is supplied through a prop. Form fields and behavior are unchanged.
Service text uses `{phone}` / `{email}` placeholders for consistent contact copy.
Without a published library/global document, the original website content remains.

## Verification

- Contact-area preview update: production build, affected-file lint and 10 focused
  collection/preview/homepage regression tests passed. The approved Facebook and
  Instagram links were saved to the existing local Global draft through the
  protected editor API, preserving its other fields. Visual review remains with
  the user under `codex.md`.
- `npm run cms:check`: 51 tests passed, including strict collection validation,
  authentication, idempotent import, draft privacy, cross-page isolation,
  immutable revisions, concurrency and delivery failure/retry.
- `npm run cms:proof`: isolated Next production build + workerd/D1 passed.
  Verified exact baseline review card HTML; both review routes refreshed;
  global contact links, social profiles, service text and contact SEO refreshed;
  repeated cached requests made zero Worker reads; restored baseline content
  via new revisions without rebuilding. Existing image workflow also passed.
- TypeScript and lint passed. No browser visual acceptance test was run.

Test output is stored in ignored `.local/collections-cms-check.log`,
`.local/collections-proof-run.log`, and `.local/cms-proof-results.json`.
The original section HTML baseline remains unchanged. Source-file hashes were
refreshed for the authorized contact wiring and previous approved CSS/card changes.

### Preview verification — 2026-10-14

Implementation commit: `20c0a33` on `cms-testing`. The Vercel Preview build is Ready
in `iad1`. Test Worker version: `1f62f8f5-798b-4c94-ba29-d48baa3b68ca`.
Its existing DB binding was verified as `breeze-test-db`
(`bc8cb3a4-bf92-4be6-82d0-84738ec3a381`), with `breeze-test-assets` unchanged.
The direct Wrangler D1 query was denied by the provider; existing schema readiness
and subsequent D1 operations were verified through the authenticated test Worker.
No schema change was needed.

- Imported all 15 existing reviews and the existing contact details into new
  documents; verified the old homepage/proof drafts and publications were unchanged.
- Protected Preview admin contains Reviews and Global navigation; unauthenticated
  editor requests return 401.
- Published both unchanged baseline documents through the Next editor API.
  Both version-1 revisions have confirmed delivery and no delivery errors.
- Homepage and `/reviews` returned Vercel cache `HIT`; the homepage's existing
  revision ID remained unchanged. No production resource or `main` was changed.

Preview: https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app/admin-test

Remote result: ignored `.local/collections-preview-results.json`.
The complete edit/save/publish/restore and zero-Worker-read checks above were run
locally; remote acceptance published only unchanged baseline content.

## Release order

1. Deploy compatible Worker code to **breeze-test-api** with its existing
   **breeze-test-db** / **breeze-test-assets** bindings and test credentials.
   Preserve the current writes setting; the checked-in config defaults to disabled.
2. Deploy `cms-testing` to the Vercel Preview. No variable changes are required.
3. Initialize Reviews/Global via the protected editor, inspect the imported
   content, and publish. Check the confirmed delivery status and public pages.
4. A future production release requires the same Worker-first order against
   the separate live environment, followed by `main`. This task does not deploy
   production, merge branches, or copy Preview credentials into live resources.
