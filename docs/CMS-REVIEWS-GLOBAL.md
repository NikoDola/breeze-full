# Reviews library and Global settings

## Editing

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

Global controls the business phone, email and footer social profiles. Supported
platforms: Facebook, Instagram, YouTube, LinkedIn, TikTok and X. Each platform can
appear once. Only direct HTTPS profile URLs on approved platform hosts are accepted.
The old generic Facebook/Instagram homepages were never displayed; they are not
published as if they were client profiles. Add the client's actual profile URLs.
Admin developer-support contact details remain separate.

## Storage and compatibility

No SQL migration is required. Two additive documents reuse `cms_pages`,
`cms_drafts`, `cms_revisions`, `cms_imports` and `cms_publish_outbox`:

| Page ID | Unique stored slug | Schema | Fields | Verification route |
| --- | --- | --- | --- | --- |
| `reviews` | `reviews` | 4 | `title`, `items[{id,name,quote,homeQuote,visible}]`, ordered `favoriteIds` | `/reviews` |
| `global` | `__global` | 5 | `title`, `phone`, `email`, `socials[{platform,href}]` | `/` |

`cms/shared/collections.ts` defines types, strict field/size validators, safe social
hosts and public selection helpers. `collection-seeds.ts` imports all 15 original
full testimonials, preserving current published homepage excerpts and additional
homepage reviewers. If a legacy home has over three featured reviews, all are
preserved in the library and the first three are initially favorites. Duplicate
names get separate IDs. Imports are idempotent and do not overwrite drafts.
Schemas 1/2/3 and immutable historical revisions remain readable and unchanged.

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
Homepage HeroSection keeps its developer-controlled markup/artwork; only its
phone data is supplied through a prop. Form fields and behavior are unchanged.
Service text uses `{phone}` / `{email}` placeholders for consistent contact copy.
Without a published library/global document, the original website content remains.

## Verification

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
