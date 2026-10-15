# Remaining pages: CMS audit and migration plan

Audit date: 2026-10-15. Status: implemented and released to production on `main`.
See `CMS-CLIENT-LAUNCH.md` for the dated backup, deployment and acceptance evidence.
The audit below records the starting state and migration decisions.

## Implementation and local verification

- 25 schema-6 documents cover 27 public routes: 13 HVAC services, two independent
  company articles, Careers, About us, Why Choose Breeze, Contact us, Emergency,
  Services, Gallery, two legal pages, and Promotions (listing plus both seasons).
  Together with Home and Reviews, all 29 public content routes have CMS content.
- `cms/shared/content.ts` and `additional-content.ts` define fields, source seeds,
  repeaters and strict validation. `src/featured/content-page/Page.tsx` loads the
  published document; `ContentPageView.tsx` uses the real section components.
  Page metadata is loaded from the same published revision.
- The admin groups Pages, HVAC, Company and Website settings. Each new document
  has content/search fields and a protected responsive preview. Reviews previews
  both the Client page and homepage favorites. Promotions previews all three routes.
- Global has optional address, Google Maps directions URL and shared contact-banner/
  service-callout text. Old Global and Reviews snapshots remain readable without
  rewriting historical revisions. Reviews also has editable page/search text.
- Careers cards and their bullets support add/remove/reorder. Colors alternate
  automatically by position; styling, icons and brand artwork remain in code.
- Gallery uses the existing upload, processing and private preview flow. Additive
  migration `0004_content_media.sql` checks ready images and records schema-6
  revision assets atomically. Missing triggers block new content saves/publication
  and fail the readiness check. Existing media/history rules remain in place.
- Publishing invalidates service dependents and all seasonal promotion routes.
  Delivery verifies the service detail plus listing, all three promotion routes,
  and (for Global) homepage, Contact us and both legal pages before confirming.
- Local migration 0004 was applied. All 25 new source baselines were imported and
  published through the protected Next API with delivery confirmed. Repeated imports
  preserved existing documents. New Global fields were added to the existing
  unpublished draft; that draft was deliberately left unpublished. Reviews retained
  its existing entries and received the original page/search text.
- Regression tests cover all seeds, page identity, old schema compatibility,
  draft conflicts, idempotent imports, publication/retry, gallery rollback/privacy/
  history, template rendering, Careers colors, and protected live preview messages.
  All 63 CMS tests passed. Type checks, lint and the isolated production build
  passed. HTTP checks confirmed all 29 public routes, 25 protected new-page previews,
  publication revision markers, admin access and unauthenticated denial. No browser
  visual check was performed, following `codex.md`; the client should inspect layouts.

### Release procedure (completed for Production on 2026-10-15)

1. Apply migration 0004 to the intended deployment's database; do not run a test
   command against the live binding. Back up/inspect existing drafts first.
2. Release the compatible Worker and Next code before clients publish new schemas
   or optional Global/Reviews fields. Existing deployed readers reject unfamiliar
   fields; do not publish these documents while an older reader still serves traffic.
3. Confirm preflight, import only missing documents, and publish reviewed baselines
   without replacing existing client edits. Verify login, preview, gallery upload,
   publication and dependent pages on that deployment.
4. Review form behavior with the client. Service and careers forms still prepare
   an email in the visitor's mail app; they do not submit to a server inbox.

Production was deployed after the client authorized the 2026-10-15 release and
backup. Existing production environment variables and credentials were retained.

## Original audit

## Requested result

Make the existing website content editable through the client admin, stored in
the CMS database, previewed in the real page layout, and published through the
existing Save draft / Publish draft workflow.

Keep the admin practical. Follow the admin interface rules in `../codex.md`.
Keep brand artwork, icons, colors, typography, spacing and component layout in
project code/assets. The client edits content within those layouts.

Specific requirements from the client:

- Meet the HVAC experts and Going green should share the HVAC article layout.
- Business address and the Google Maps directions link belong in Global settings.
- Careers needs editable, repeatable cards, initially Experience and Benefits
  to Consider, with support for additional cards such as Responsibilities.
- Careers card positions 1, 3, 5, etc. use light blue `#d8f0f2`; positions 2, 4,
  6, etc. use light orange `#ffdfbd`. The client has no color controls.
- Include promotions, company/about pages and the remaining public pages in the
  migration scope.

## Current coverage

There are 29 public content routes in the current sitemap: 16 named routes and
13 HVAC/service detail routes. Homepage and the Reviews library already read
CMS publications. Global settings already supplies phone, public email, form
recipient email and social links. Other pages use those contact details where
wired, but their main content is still in source files. Reviews page hero/SEO
copy and several shared text areas also remain in code.

The disabled CMS proof route, authentication, API routes, 404, robots and sitemap
are application infrastructure, not client content pages.

| Pages | Current content source | Proposed admin content |
| --- | --- | --- |
| `/` | `cms/shared/home.ts`, published Home document and fixed hero | Preserve existing homepage editor and its design restrictions; reconcile map ownership with Global. |
| `/reviews` | Published Reviews library; route file for hero and metadata | Preserve review management; include page heading, introduction and SEO in its page settings. |
| `/services` | `src/lib/services.ts`, route file | Listing hero/SEO; cards derived from each published service's title, summary and image reference. |
| 13 service detail routes listed below | `src/lib/services.ts`, individual route metadata | One document per service: hero text, summary, ordered body blocks, schedule copy, related entries and SEO. |
| `/meet-the-hvac-experts`, `/going-green` | `ExpertsContent.tsx`, `src/lib/company.ts`, route files | Separate article documents using the same layout primitives and content editor as services. |
| `/about-us` | Route file, `src/lib/company.ts` | Hero, introduction, experience badge text, history/philosophy, values cards, owner section, links and SEO. |
| `/why-choose-breeze` | Four `home/` section components plus `ExpertsContent.tsx` | Existing fixed section sequence with editable headings, body text, service selections, story cards and article content. |
| `/careers` | Route file, `careerExperience` and `careerBenefits` in `company.ts` | Hero, repeatable cards and bullet lists, application introduction and SEO. |
| `/contact-us` | Route file plus `getSite()` | Page introduction, contact card labels/notes, emergency text and SEO. Actual contact values and location come from Global. |
| `/promotions` | Route file and `src/content/promotions.json` | Listing hero/intro/SEO and presentation of the published seasonal offers. |
| `/summer-promotions`, `/winter-promotions` | `src/content/promotions.json`, `PromoPage.tsx` | Offer title, tagline, offer text, optional code, body, related service, image reference/description and SEO. |
| `/emergency` | Route file and `emergency` in `company.ts` | Hero, call strip, paragraphs, service list, feature cards, related links and SEO. |
| `/gallery` | Nine entries in the route file | Ordered images, descriptions/captions, add/remove/reorder controls, introduction and SEO. |
| `/privacy-policy`, `/terms-and-conditions` | `src/lib/legal.ts`, route files | Existing text, effective/updated label, introduction, ordered sections/lists and SEO. Preserve approved wording during import. |
| Shared content | `site.json`, `CtaBand.tsx`, header/footer and form components | Put shared business details and agreed editable shared copy in Global; use references instead of copying the same phone, address or CTA into page documents. |

Service routes: `/heating`, `/cooling`, `/repairs-and-services`, `/indoor-quality`,
`/water-heater-solutions`, `/mini-split-systems`, `/energy-audits`,
`/commercial-industrial`, `/residential`, `/property-manager`, `/comfort-club`,
`/financing`, `/wi-fi-and-learning-thermostats`.

## Findings that affect implementation

### Shared article layout, independent content

`ServicePage.tsx` renders a hero, structured paragraphs/headings/lists, callout
cards and related-service navigation. Meet the HVAC experts and Going green
currently use the article variant of `ExpertsContent.tsx`, which has its own
markup and styles. Their rounded body image is already absent and their related
cards are below the body.

Both company articles currently render the same three text blocks from
`company.ts`; Why Choose Breeze also uses those blocks. Sharing the component
does not make their content independently editable. Seed a separate document for
each page, preserving the current words, then use a common article renderer for
services and the two company articles. Preserve each page's relevant links and
supported callouts. Do not silently replace Going green's wording with newly
invented environmental claims.

Use a fixed route/template registry to select artwork, icons and layout behavior.
Keep route slugs stable for this release. Reuse the current heading/paragraph/list
model with stable block IDs and bounded content. The existing rich-text format
is designed for short headings; it is not a complete article-body format.

### Global address and maps

`src/lib/site.ts` currently formats the address from `src/content/site.json` and
generates a Google Maps search URL. `withGlobalSettings()` overrides contact
details but does not override the address or map link.

Add structured address fields (street, city, state/region, postal code, country)
and a Google Maps directions URL to Global. Keep formatted addresses and link
generation derived in one helper. Validate supplied URLs using the approved
Google Maps hosts and HTTPS; do not accept arbitrary iframe markup or scripts.

The contact page embeds OpenStreetMap with fixed coordinates, so editing the
address alone would leave its map at the old location. Replace that fixed source
with a map generated from the saved location. The existing homepage Google map
helper is a candidate for reuse; external links and map embeds need distinct
validation and rendering.

The homepage already stores `mapsHref`, `mapLocation` and `mapTitle` in its Area
section. Its default map centers on Nashville, while its directions link points
to the business address. Keep the regional service-area center separate from the
office address. Use Global for the business directions link and retain Home's
section heading, description, link label and service-area map settings. Inspect
existing published values before migrating competing links; preserve deliberate
differences and avoid overwriting client edits with source defaults.

Apply the shared address to Contact us, legal-page contact sections and contact
metadata. Global previews currently show homepage areas only; add a Contact us
location preview so address/map edits are visible where they appear.

### Repeatable careers cards

Careers currently has two hard-coded card containers and two string arrays.
Use one ordered `cards` collection, each with a stable ID, editable title and
ordered bullet items. Provide Add card, Move up/down and Remove controls plus
equivalent bullet-list controls. Seed the two existing cards exactly. A new
Responsibilities card uses the same editor and renderer.

Determine blue/orange styling from the rendered position, including after
reordering. Keep icon treatment in the component. Additional cards must stack
cleanly next to the application form and above it on narrow screens. Apply
reasonable field/list limits together with the existing total request-size cap.

The careers and service forms currently open the visitor's email application.
They do not submit to a server inbox or store applications in D1. Migrating page
content does not change that behavior; verify the intended submission experience
before declaring the site client-ready. The recipient already comes from Global.

### Promotions need shared publishing

The comment in `src/lib/promotions.ts` saying its JSON is managed via `/admin`
is stale. The current editor does not expose promotions, and the old filesystem
write API is disabled.

Use one Promotions document for listing copy and the existing two seasonal
offers. This allows a publication to update a listing card, its detail page and
its SEO together. Keep the existing seasonal URLs. New arbitrary promotion URLs
would require routing/sitemap work and are not necessary for the existing pages.

Do not introduce offer expiry, hidden-offer behavior or scheduling implicitly.
Those features need defined public-route behavior if added later. Preserve the
current offer wording, codes and terms during migration.

### Images have an additional dependency

D1 stores content and media references; uploaded image bytes belong in the
existing R2 media storage. Brand icons and custom artwork remain project assets.
Existing content photos can remain approved asset references until the relevant
page supports media selection; gallery management needs the upload workflow.

The media library infrastructure exists, but its editor is currently attached to
the disabled proof document. Worker asset validation and the SQL publication
triggers in `0003_media.sql` inspect only schema 3 at `section.images`.

Before enabling uploads for Gallery or other pages, extend both application
validation and database publication/reference tracking for the new document
shapes. Use a new forward migration; do not edit an already-applied migration or
rewrite immutable revisions. Preserve private draft previews, ready-image checks,
published reference tracking and the existing processed-image sizes. Merely
placing an upload button in the new editor would leave this work incomplete.

## Database and admin approach

The existing `cms_pages`, `cms_drafts`, `cms_revisions`, `cms_imports` and
`cms_publish_outbox` tables can hold the new page documents. Ordinary text page
additions do not require a separate SQL table per page. The media work above does
require extending the database rules.

Introduce a documented, versioned document contract for each template family:
article, fixed company page, careers cards, promotions collection, gallery,
contact/emergency and legal sections. Retain compatibility with existing Home,
Reviews and Global snapshots. Unknown fields, CSS, icon overrides, unsupported
links and raw HTML remain rejected by both Next and Worker validation.

Extend these integration points together:

1. `cms/shared/contract.ts`: allowed page IDs, routes, types and validation.
2. Shared seed data: import each current page without losing text or links;
   repeated imports must not replace a saved draft or publication.
3. `workers/cms/src/index.ts`: the public endpoint currently allows only
   `cms-proof|home|reviews|global`; extend it from the validated page registry.
4. Public loaders and route metadata: render published database content on the
   server. Source files remain initial seed/fallback data, with a clear distinction
   between no publication yet and a CMS connection failure.
5. Admin navigation and fields: group Pages, HVAC, Company and Website settings;
   use specific fields and repeaters rather than a raw JSON editor.
6. Preview: generalize the protected iframe, which currently supports Home and
   Global modes. Render each page through its real components and block form
   submissions/navigation in the preview. Invalid drafts retain the last valid
   preview. Preview data remains private.
7. Publishing: add publication markers and explicit dependent-route invalidation.
   A service edit can affect its detail page, the services listing and selected
   service cards. Promotions affects three routes. Global affects the site layout
   and contact metadata. Verify dependent views as well as the event's primary
   route; the current delivery check confirms one route.

Preserve optimistic draft version checks, immutable history, retry behavior and
the existing local/Preview/Production isolation. No new admin credentials are
needed just to add page types. A compatible Worker/Next release sequence is
required so the editor cannot publish documents that the deployed reader rejects.

## Suggested implementation order

1. Expand Global address/location and its preview, then establish the reusable
   page registry, content fields, preview and publishing dependencies.
2. Migrate Careers with repeatable cards and verify adding/reordering a third card.
3. Migrate the 13 services, service listing and two company articles through the
   common article model, retaining independent content per route.
4. Migrate Promotions and its two detail pages as one publishing unit.
5. Migrate About us and Why Choose Breeze with their existing section layouts.
6. Migrate Contact us, Emergency, Gallery, legal pages, remaining Reviews page
   text and agreed shared copy. Complete media support before enabling uploads.
7. Seed and verify all pages in local/Preview, then prepare the production release
   using `CMS-CLIENT-LAUNCH.md`. Check actual published content against current
   source and existing database edits before any production import.

## Completion checks

- Every in-scope page has an admin entry, usable fields and an accurate preview.
- Initial database imports preserve current content, metadata and approved design.
- Changing one article does not alter another article's body.
- Service cards, promotion cards and detail pages agree after publishing.
- Address/directions changes update Contact us, legal contacts and the selected
  previews; office and regional maps keep their intended meanings.
- Careers supports additional cards and bullet items, with automatic alternating
  colors after add/remove/reorder and readable mobile layouts.
- Uploads reference ready media; unpublished images stay private; publication
  records their references atomically and preserves historical revisions.
- Drafts remain private; concurrent saves report conflicts; cache retry confirms
  the existing publication without creating duplicate revisions.
- Meaningful schema, workflow, migration and rendering tests pass, followed by
  lint/type checks and the required production build. Visual review follows
  `codex.md`.
- Production release has the new code and compatible Worker, preserved content,
  verified login, working publication and a checked client form experience.

The original audit used source, database migrations and CMS documentation.
Implementation and verification performed afterward are recorded at the top.
