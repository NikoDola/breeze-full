# Sol handoff: Breeze mini CMS

**Homepage follow-up:** [CMS-HOMEPAGE-MIGRATION.md](CMS-HOMEPAGE-MIGRATION.md)
documents the approved first real migration, component-specific version-2 schemas,
page-scoped API/caching changes and current editor. Read it before applying this
historical handoff's suggested generic layouts or migration order.

Prepared 2026-10-12. Start from **`cms-testing`**, never merge or deploy to production
without a new user instruction. The user asked to stop refactoring and extra
testing at this handoff. The next milestone is the visual CMS: controlled section
layouts, images, page creation, and blog posts, delivered in small stages.

## Read first

1. `AGENTS.md`, `docs/WEBSITE.md`, and `codex.md`.
2. The relevant installed `node_modules/next/dist/docs/` guides before framework
   edits. This project is pinned to **Next 16.3.8**, React 19, TypeScript, Node 22.
3. [CMS-MILESTONE-1.md](CMS-MILESTONE-1.md): setup and detailed implementation.
4. [CMS-PREVIEW-RESULTS.md](CMS-PREVIEW-RESULTS.md): actual evidence and limits.
5. [CMS-PREVIEW-ACCESS.md](CMS-PREVIEW-ACCESS.md): why Next owns delivery and the
   Worker must never receive a Vercel automation credential.

The actual public site uses **plain CSS**, not Tailwind. Preserve the existing
design, routes, responsive behavior, SEO, animations, homepage hero, and contact
form. No broad page migration or public redesign has been authorized.

## Repository and environments

| Item | Location/name |
| --- | --- |
| Local project | `C:\Users\Dolov\Desktop\solid-code\website-products\breeze-web` |
| GitHub | `NikoDola/breeze-full` |
| Working branch | `cms-testing` |
| Vercel project | `breeze-full`, team `nikodolas-projects` |
| Editor | `https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app/admin-test` |
| Published proof | Same origin, `/cms-proof` |
| Test Worker | `https://breeze-test-api.nikodola.workers.dev` |
| Test D1 | `breeze-test-db`, `bc8cb3a4-bf92-4be6-82d0-84738ec3a381` |
| Production resources to leave alone | `breeze-api`, `breeze-db`, production Vercel deployments |

`vercel.json` selects `iad1`; runtime preflight verified it. The test Worker is
bound only to the test database. Both SQL migrations are already applied remotely.
Deployed test writes are enabled after security preflight; checked-in Wrangler
configuration defaults to disabled. A plain redeploy therefore disables writes
unless the deliberate test-only override is supplied.

The original Worker is dashboard-managed, with no exported source in this repo.
Only its public `GET /api/sections/home-hero` was used. Its complete live schema
has not been inspected; do not infer it from returned JSON. No R2 bucket was
created. Confirm with the user before creating/changing Cloudflare resources for
the image phase. Never bind a test Worker to the production D1 ID.

At handoff, unrelated local work includes untracked `sqllite-app/` and a new
leading backtick in `AGENTS.md`. These were not made by this CMS work: leave them
uncommitted and do not revert or delete them. All completed CMS work is committed
separately. Check fresh Git status before editing.

## Implementation map

| Files | Responsibility |
| --- | --- |
| `cms/shared/contract.ts` | Validated version-1 document, draft/publication/delivery types, fixed test scope, legacy import mapping |
| `cms/shared/signature.ts` | Timestamped HMAC signing/verification |
| `workers/cms/migrations/0001_cms_workflow.sql` | Additive CMS tables, constraints, immutable revision triggers |
| `workers/cms/migrations/0002_next_delivery.sql` | Additive delivery lease token |
| `workers/cms/src/index.ts` | Worker test/write gate, bearer authorization, parameterized D1 queries, atomic publish, version conflicts, outbox leases and acknowledgments |
| `workers/cms/wrangler.jsonc` | Test-only bindings and safe write-disabled deployment default |
| `src/lib/cms/access.ts`, `src/proxy.ts` | Preview/local access, Basic auth, host/origin and mutation guards |
| `src/lib/cms/worker.ts` | Server-only Worker bridge; no-store admin requests |
| `src/lib/cms/delivery.ts` | Preview OIDC, claim → invalidate → verify HTML → acknowledge; read-only preflight |
| `src/lib/cms/public.ts` | Published-only tagged fetch cache, ISR data loader, React request memoization |
| `src/featured/admin-test/` | Thin proof editor, API handler, HMAC revalidation handler, CSS module |
| `src/featured/cms-proof/page.tsx` | Cached proof page and metadata using the same loader |
| `src/components/sections/CmsProofContent.tsx` | Existing proof presentation and local editor preview |
| `src/app/admin-test/`, `src/app/cms-proof/`, `src/app/api/cms/` | Thin route adapters |
| `workers/cms/tests/` | Local D1/security/delivery tests; local production-build proof; remote measurement harness |

Confirm exact file names with `rg --files` before editing. The homepage hero and
actual form implementation remain developer-controlled and outside this model.

## Database contract

| Table | Key fields and guarantees |
| --- | --- |
| `cms_pages` | `id`, unique `slug`, `page_type` (`page`, `blog`, `service`), nullable `published_revision_id`, `created_at`; trigger ensures the pointer belongs to this page |
| `cms_drafts` | `page_id` primary key, positive `version`, valid `document_json`, `updated_at`; optimistic version check on edits |
| `cms_revisions` | `id`, `page_id`, `draft_version`, `document_json`, `published_at`; unique `(page_id, draft_version)`; UPDATE and DELETE forbidden by triggers |
| `cms_imports` | `page_id`, `source_id`, original `source_json`, `imported_at`; repeated imports preserve existing edits |
| `cms_publish_outbox` | `id`, unique `revision_id`, `attempts`, `next_attempt_at`, `lease_until`, `lease_token`, `invalidated_at`, `confirmed_at`, `last_error`; pending-job index |

Version-1 JSON contains `schemaVersion`, `title`, `seoTitle`, `seoDescription`, and
one `section` with `eyebrow`, `headline`, `body`, `button_text`, `button_route`,
`bottom_note`, and `images: string[]`. Only this one proof page is implemented;
the `page_type` column does not imply dynamic page creation already works.

Extend through a validated version-2 document with optional page hero and ordered
section IDs/types/layout configuration. Keep readers for existing version-1
revisions. Do not rewrite old published JSON. Additive migrations are preferred;
never recreate tables or change immutable-revision triggers just to simplify UI.
Page deletion will need archival/unpublishing semantics compatible with revision
retention. The current schema is intentionally a proof, not a finished generic CMS.

## HTTP API

Public Worker responses are `no-store`; Next owns the persistent content cache.
Administrative Worker requests require a server bearer credential and reject
browser Origin headers. Except health, they also require test writes enabled.

| Worker endpoint | Method | Input/result |
| --- | --- | --- |
| `/api/public/pages/cms-proof` | GET | Published immutable snapshot only, or 404 |
| `/api/admin/health` | GET | Authenticated schema/environment/write-status check, available with writes disabled |
| `/api/admin/proof` | GET | Current draft, publication, and delivery state |
| `/api/admin/import` | POST | `{source}` legacy source JSON; preserves existing import/draft |
| `/api/admin/draft` | POST | `{expectedVersion, document}`; stale writes return 409 |
| `/api/admin/publish` | POST | `{expectedVersion}`; atomic, idempotent for the same draft version |
| `/api/admin/delivery/claim` | POST | `{force}`; returns `{claim}` or null; unique 90-second lease |
| `/api/admin/delivery/ack` | POST | `{eventId, leaseToken, stage}`; stages `invalidated`, `confirmed`, or `failed` with controlled failure `reason` |

Browser clients use **Next**, never Worker admin endpoints:

- `GET /api/cms/editor`: fresh editor state.
- `POST /api/cms/editor`: `action` is `import`, `draft`, `publish`, `retry`, or
  `preflight`; relevant draft actions also send `expectedVersion`/`document`.
- `POST /api/cms/revalidate`: server-only signed event, not a browser editing API.
  Fixed page/path/tag, HMAC timestamp window, Preview scope; dry-run preflight is
  supported. No arbitrary purge path is accepted.
- `/admin` redirects to the protected test editor; old `/api/admin` and
  `/api/admin/upload` return 410 on this branch.

## Publishing and caching invariants

1. Draft saves never invalidate public content. Preserve expected-version checks
   and unsaved-edit handling as the UI grows.
2. Publishing atomically inserts an immutable snapshot, changes the public
   pointer, and inserts the delivery job. A failed delivery never undoes or
   duplicates that committed revision.
3. Next claims a 90-second lease and obtains its request's short-lived Preview
   identity with `getVercelOidcToken()`.
4. Next sends OIDC + its own HMAC to the pinned Preview revalidation route. This
   separate request must complete before HTML verification; it calls
   `revalidateTag(tag, {expire: 0})` and `revalidatePath('/cms-proof')`.
5. After acknowledgment of invalidation, Next requests published HTML with OIDC,
   checks embedded revision/version, then acknowledges confirmation. The Worker
   receives only its own write token, never OIDC or the Next HMAC key.
6. A failure leaves durable pending status, safe error text, and retry backoff
   from 30 seconds to one hour. Manual retry may skip backoff but cannot steal an
   active lease. Stale lease tokens cannot acknowledge someone else's attempt.
   A newer confirmed revision fulfills older pending delivery records.

Current public rendering uses explicit `fetch(..., {cache: 'force-cache', next:
{tags: [...], revalidate: 3600}})` and ISR. Cache Components are not enabled.
React `cache()` shares the loader across metadata/page rendering because an
explicit AbortSignal disables Next's automatic fetch deduplication. Do not remove
this wrapper accidentally. Public cache misses use a `first-primary` D1 session.
Editor APIs are dynamic/no-store. Drafts never enter the public loader.

Current tag: `cms:preview:cms-testing:page:cms-proof`. When generalizing pages,
derive environment/client/page-specific tags and validated route mappings on the
server. Do not accept arbitrary invalidation targets from client JSON. Retain
cached server rendering without ordinary client-side content fetching or skeletons.

There is no unattended delivery runner. The editor exposes manual retry. The
Worker has no cron or Vercel callback credential. Vercel Cron targets production
and must not be added as a shortcut for this Preview workflow.

## Required environment variables (names only)

| Location | Names |
| --- | --- |
| Next local / branch-scoped Vercel Preview | `CMS_TEST_ENABLED`, `CMS_TEST_ORIGIN`, `CMS_WORKER_URL`, `CMS_TEST_USERNAME`, `CMS_TEST_PASSWORD`, `CMS_WRITE_TOKEN`, `CMS_REVALIDATE_SECRET` |
| Worker ordinary configuration | `CMS_ENVIRONMENT`, `CMS_WRITES_ENABLED` |
| Worker secret | `CMS_WRITE_TOKEN` only |
| Worker resource binding | `DB` |
| Vercel-managed identity/context; do not manually override | `VERCEL`, `VERCEL_ENV`, `VERCEL_REGION`, `VERCEL_GIT_COMMIT_REF`, `VERCEL_OIDC_TOKEN` |
| Local proof runner only | `CMS_LOCAL_PROOF_BUILD` is managed by the proof script and must remain unset on Vercel |

Examples contain blanks/placeholders. Actual settings live in provider dashboards
and ignored local files. `.local/cms-preview.env` holds local remote-test settings;
`.env.local` holds local configuration and the expiring development OIDC token.
Use `.dev.vars` for local Worker secrets. Do not print, commit, or copy values into
the handoff. No `NEXT_PUBLIC_` secret variables. No R2 credentials are configured.

The seven CMS Preview variables are scoped to **Preview + `cms-testing`**. Basic
authentication is a temporary test gate, with no default password or browser
storage. Both route handlers and Proxy enforce access. Mutation checks require
the exact Origin and `x-cms-request: editor`. Production environments fail closed;
Preview branch, host, Worker origin, and OIDC project/environment are pinned.
Vercel Deployment Protection remains enabled. No broad automation bypass exists.

## Completed and remaining

**Completed:** security/build repairs on this branch; separate migrated test D1
and Worker; protected thin editor; draft privacy; immutable/idempotent publishing;
durable cache-delivery state/retry; OIDC self-access; scoped invalidation; cached
public proof; local test suite; deployed workflow and bounded performance evidence.
The user confirmed browser access to the editor.

**Known limitations:**

- Automated Vercel Security Checkpoint responses interrupted the longer
  benchmark. This is recorded, not hidden as successful cache traffic. The Hobby
  plan lacks a domain/IP system exception. Do not weaken protection to finish it.
- The last test publication contains a `Recovery proof` marker. Restoration was
  blocked before any write; restore original imported text through the editor
  when convenient. All deliveries were confirmed in the last audit.
- Existing imported image names are unqualified filenames and are not rendered
  or editable. Original `/contact` button destination is preserved even though
  the site's contact route is `/contact-us`.
- Full live Worker source/schema, automated backups/retention, and restore drills
  remain future integration work. An ignored initial test export exists.
- No page/section CRUD, layout selector, page hero, dynamic blog/service/page
  routes, upload/media library, production login/roles, or unattended retry runner.
- Security repairs on `cms-testing` have not been promoted to production; do not
  describe the unchanged production/main deployment as receiving these fixes.

## Suggested next slices

1. **Visual editor over the existing proof:** improve the editing interface,
   preserving save/publish/pending/confirmed distinctions and manual retry. Reuse
   the existing API rather than starting a separate editing backend.
2. **Versioned sections:** introduce validated section types and layouts A–D,
   IDs/order/visibility, buttons, controlled image positioning and ratios. Build
   reusable renderers and accessible single-image/multi-image slider behavior.
   Keep `page-hero` distinct from the custom homepage hero.
3. **Media slice:** after user confirmation, use separate test R2 storage;
   server-side upload/type/size validation, unique keys, media metadata and alt
   text, image selection/order/removal. Plan retention for assets referenced by
   immutable revisions; do not delete a file still used by published history.
4. **Pages/blogs/services:** generalize fixed proof scope deliberately; add unique
   slug/type validation, reserved-route protection, optional separate hero,
   drafts/publications, metadata, and dynamic published-only routes. Inventory
   existing content before migrating one page at a time.
5. **Production readiness later:** authenticated sessions and authorization,
   audit actor identities, rate limiting, backups/restore drill, secure unattended
   retry and operational monitoring. Request explicit production authorization.

Future client deployments should share maintained CMS code/contracts while using
independent databases, buckets, secrets, and deployment configuration. Current
Breeze pins are intentional isolation controls: replace them with validated
server configuration when needed, never a browser-selected database/Worker URL.

## Verification budget for Sol

Do not rerun the entire remote benchmark merely to begin UI work. Use focused
checks for concrete risks. `codex.md` requires a build for compilation-affecting
changes; small visual CSS changes are user-reviewed. Available commands:

```powershell
npm run typecheck
npm run build
npm run cms:check
npm run cms:proof
```

`cms:check` exercises real local workerd/D1. `cms:proof` builds an isolated Next
production output and tests local caching; it only reads the legacy public API.
Remote `cms:preview-workflow` mutates the isolated test proof and may hit Vercel's
checkpoint. See the setup guide for pacing/curl options and diagnostic exit codes.
It is not a routine gate for every visual change.

Before committing: inspect Git status, stage explicit task files, exclude `.env`,
`.local`, `.vercel`, `.wrangler`, exports, credentials, and unrelated user work.
Push only `cms-testing`. A push triggers a Preview, never a main merge.
