# Breeze client CMS deployment

Client launch authorized on 2026-10-13. This supersedes the earlier restriction
against integrating `cms-testing` into `main` for this deployment. The public
website's design, homepage hero and contact form remain developer-controlled.

## Environments

| Environment | Next origin / branch | Worker | D1 | Private R2 |
| --- | --- | --- | --- | --- |
| Client | `https://breeze-full.vercel.app` / `main` / Vercel Production | `breeze-live-api` | `breeze-live-db` | `breeze-live-assets` |
| Preview | `https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app` / `cms-testing` | `breeze-test-api` | `breeze-test-db` | `breeze-test-assets` |
| Local | `http://localhost:3000` | Wrangler on `127.0.0.1:8787` | Local emulator | Local emulator |

The legacy `breeze-api` and `breeze-db` are untouched. The client database ID is
`829be11e-abe5-4e7f-b6d2-7816cdcb5709`. Its deployment file is
`workers/cms/wrangler.live.jsonc`; the existing default configuration stays test-only.
Both configurations default to writes disabled. Do not deploy the live config
without checking the target and the release checklist below.

## Client access and scope

The public website requires no CMS credentials. `/admin` redirects to the editor
at `/admin-test`. The editor, its iframe, media previews and all write APIs require
a new, independent username and random password over HTTPS. Preview credentials
do not authenticate on the client origin. Credentials are not stored in browser
JavaScript, document JSON or Git. Origin/host checks and the mutation request
header remain required in addition to authentication.

This release uses a shared, protected client account. Individual accounts, MFA,
roles, identity audit trails and an application logout remain follow-up work.
HTTP Basic credentials can remain cached for the browser session; use a private
window on shared computers. Rotate the Production password to revoke access.

`src/lib/cms/scope.ts` requires the live enable flag, Production environment,
`main` branch, exact client hostname and exact live Worker URL together. Enabling
the live flag on Preview fails closed. Existing test flags cannot enable live
editing. Alternate deployment aliases do not accept CMS authentication. Keep
these checks when introducing a custom domain; review that change explicitly.

## Environment variables (names only)

Vercel **Production only**:

- `CMS_LIVE_ENABLED`
- `CMS_LIVE_ORIGIN`
- `CMS_LIVE_USERNAME`
- `CMS_LIVE_PASSWORD` — secret
- `CMS_WORKER_URL`
- `CMS_WRITE_TOKEN` — secret, unique to the live Worker
- `CMS_REVALIDATE_SECRET` — separate Next-only secret

The live Worker has `CMS_ENVIRONMENT=live`, `CMS_UPLOAD_ORIGIN` set to the exact
client origin, a deliberate `CMS_WRITES_ENABLED` override, and only
`CMS_WRITE_TOKEN` as a secret. It receives no Vercel credentials. The existing
Preview variables/secrets keep their original branch scope and values.

Ignored `.local/cms-live.env` is the operator's recovery configuration.
`.local/cms-client-access.txt` contains only the client editor URL and login;
share that privately, never the full operator configuration. Neither file is
committed. There are no `NEXT_PUBLIC_` secrets.

## Content and media transfer

The source test database was exported before migration. The new empty database
received the existing migrations 0001–0003, then copies of pages, drafts, imports,
media records and immutable revisions. Published JSON, IDs, timestamps and media
references are preserved. The source database is not rewritten.

Old one-use upload grants are not copied. Delivery receipts in the new database
start pending because Preview confirmation does not confirm client-site delivery.
Normal Next delivery confirms the current published revisions in their new scope.
Original files and processed copies are copied to the separate private bucket
and checked byte-for-byte using SHA-256 after download. No original is deleted.
Bucket `r2.dev` and public custom domains stay disabled.

The current media editor belongs to CMS proof. Existing homepage artwork remains
developer-controlled; copying the deployment does not migrate additional pages
or add image fields to the homepage schema.

## Publishing and cache isolation

The immutable D1 transaction and durable delivery lease/retry protocol are reused.
Client cache tags use `cms:live:breeze:page:<id>`; Preview retains its existing tags.
The content loader uses only the pinned environment's Worker and published data.
Public HTML remains server-rendered and cached; editor reads remain no-store.

Next owns invalidation and verifies public HTML. Its short-lived OIDC token must
match this Vercel project **and the current deployment environment**: production
for the client, preview for testing. HMAC credentials are independent per
environment and go only to that environment's exact Next origin. Redirects are
refused. No Preview-to-production trusted-source rule or automation bypass is
created. This uses Vercel's default same-environment self-access:
[Trusted Sources](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/trusted-sources).

Publication survives an invalidation/verification failure. The editor's manual
retry claims the existing durable job without creating another revision. No
unattended retry worker is introduced by this launch.

Next Image permits the live Worker's `/media/` prefix in Production and the test
Worker's prefix in Preview. Private IP optimization remains disabled on Vercel.
Image IDs and versioned immutable delivery URLs retain the existing provider adapter.

## Release and rollback

1. Keep a source export and checksum-verified media copy under ignored `.local/`.
2. Test/build on `cms-testing`; deploy the separate live Worker with writes disabled.
3. Configure independent Production variables, then integrate into `main`.
4. Verify the client hostname, `main`, `iad1`, production OIDC/HMAC and media
   readiness using the authenticated preflight while writes are disabled.
5. Only then deploy the live Worker with `--var CMS_WRITES_ENABLED:true` and
   exercise draft/publish/retry/media through the client Next API. Restore
   acceptance-test edits and retain their immutable revisions.
6. Record release evidence here. Do not run the full latency benchmark for a release.

The requested Git backup is `backup/main-before-cms-2026-10-13`, pointing to
`17d24ec778c5b103c42eee6c3cbf7fbd8b322f48`. The previous Vercel deployment is
`dpl_3Fbmjtr9gEfiTyTVTpTq9q7Gv3vD`
(`breeze-full-lh8qfqiif-nikodolas-projects.vercel.app`).

Prefer Vercel's deployment rollback for an urgent display rollback, then reconcile
Git with a reviewed revert. Do not force-reset shared history or delete the new
database/bucket: Git rollback does not restore or roll back CMS content. Keep the
independent client data for recovery. Existing immutable revisions remain intact.

D1 provides point-in-time recovery; manual export and restore still need a tested
operating procedure and retention policy. No destructive cleanup is enabled.
See [D1 Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/).
