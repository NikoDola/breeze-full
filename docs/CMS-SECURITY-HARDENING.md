# CMS security hardening

Implemented on `cms-testing`, following the rich-text security audit. This keeps
the existing Basic authentication, content contracts, immutable revisions and
Next-owned delivery/retry workflow. No database migration or new secret is needed.

## Clipboard bounds before parsing

`src/featured/admin-test/rich-text-extensions.ts` handles native paste events
before ProseMirror reads/parses the clipboard. It rejects files and combined HTML
and plain-text payloads over 48 KiB. A cheap string-length check precedes UTF-8
encoding, including for multibyte text. Rejection leaves the current heading intact.
Programmatic/fallback paste transformations also check size before parsing.
Drops are rejected at the DOM event boundary. Existing schema sanitization,
600-character heading limits and independent Next/Worker validation remain active.

## Authentication throttling

Use Cloudflare's native Workers Rate Limiting bindings, not process-local counters,
content-table writes or a new Redis service. Counters are shared within a Cloudflare
location and are approximate/eventually consistent; this is a brute-force speed
bump, not a strict global quota or distributed-bot defense. See the official
[binding documentation](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/).

| Boundary | Limit | Key |
| --- | --- | --- |
| Next admin HTML and CMS APIs | 120 requests with an Authorization header / 60 seconds | HMAC of environment origin and trusted source IP |
| Direct Worker admin API | 600 requests / 60 seconds | HMAC of Cloudflare source IP, scoped to Worker environment |

All supplied credentials, including incorrect ones, spend a token **before** the
password comparison. A correct password cannot bypass an exhausted bucket. An
initial Next Basic challenge without an Authorization header does not spend one.
HTML is checked in `src/proxy.ts`; API handlers check independently, so one request
is not charged twice. Static editor assets and ordinary public pages are excluded.

Next only trusts Vercel's `x-vercel-forwarded-for` header, validates/canonicalizes
the IP and hashes it with the existing server token. See
[Vercel request headers](https://vercel.com/docs/headers/request-headers#x-vercel-forwarded-for).
Local development uses one fixed loopback bucket and ignores forwarded headers.
The Worker uses `cf-connecting-ip` for its direct-source limit. Browser passwords
and raw visitor IPs are never sent to the limiter endpoint or logged by this code.

`POST /api/admin/auth/throttle` accepts exactly one 64-character hexadecimal `key`
with a 256-byte body cap. It requires the existing Worker Bearer secret, enabled
environment and absence of a browser Origin. It works with content writes disabled
and never queries D1 or touches R2. It returns `{ success, degraded }`.

### Availability and normal editing

- Rejections return HTTP 429, `Retry-After: 60` and private/no-store responses.
- There is no permanent lockout or username-wide bucket. Another source IP is
  unaffected. Shared networks can still share a limit; pause requests for 60
  seconds before retrying. Normal local save/publish/media workflows passed with
  the configured limits. Do not claim legitimate traffic can never be limited.
- A Vercel outbound IP may be shared by several admins, so the direct Worker
  allowance is higher and counts both throttle and content operations.
- If the limiter is unavailable, its binding is missing or Next's 1.5-second
  request times out, throttling degrades open to avoid locking out the admin.
  **Basic authentication, host/environment checks and CSRF still run.** This
  deliberately prioritizes availability over throttling during an outage.
- Next logs `cms.auth.throttle-degraded`; the Worker logs that event and
  `cms.auth.rate-limited`. Investigate degraded events rather than treating them
  as healthy protection. Authenticated `GET /api/admin/health` now includes
  `throttlingReady` (binding presence, not a global availability guarantee).
- Each admin request adds one server-to-Worker request. There are no extra D1
  reads/writes for throttling; normal Worker request usage still applies. No
  subscription or separate service was added.

The two bindings are `AUTH_RATE_LIMITER` and `SERVICE_RATE_LIMITER`. Test namespace
IDs are `2026101401`/`2026101402`; live config reserves `2026101403`/`2026101404`.
Use distinct IDs per client/environment to avoid shared counters. Live configuration
is prepared in the branch only; applying it to production requires release approval.

## Report-only CSP

`src/lib/cms/csp.ts` defines the candidate policy. Only the already-dynamic admin
HTML and protected preview receive it. `src/proxy.ts` generates a fresh nonce and
passes the policy in the **request** CSP header for Next's script rendering. The
browser receives the candidate in `Content-Security-Policy-Report-Only`.

The policy allows nonced scripts with `strict-dynamic`, same-origin assets and
requests, configured Worker images/uploads, blob/data image previews and the
Google Maps iframe. Inline styles remain allowed for existing React/Tiptap styles.
`unsafe-eval` is development-only. Public pages retain their current static/cache
behavior and receive no new policy/nonces.

Existing enforced framing protection lives in `next.config.mjs`: no framing for
admin/API routes, same-origin framing for `/admin-test/preview`. Do not add that
different enforced CSP response header in the proxy: this Next version copies it
over the request policy and loses nonce extraction. The production-server test
checks every generated script against its actual response nonce.

Report-only violations are visible in browser DevTools; **there is no remote report
collector or telemetry service**. Before enforcement, manually exercise toolbar,
paste, preview resize, uploads, save/publish and retry in the Preview, checking the
console and network panel. Browser extensions and the Vercel preview toolbar may
produce unrelated reports; do not broadly allow their sources in the app policy.
The automated checks validate actual HTML/headers and DOM editor behavior; they do
not claim a full browser CSP-enforcement test. Keep this policy report-only until
that manual observation is complete.

## Release and verification

1. Deploy `workers/cms/wrangler.jsonc` to **breeze-test-api** first, preserving its
   current write flag and secrets. This adds both native bindings. No SQL step.
2. Check authenticated Worker health reports `environment: test` and
   `throttlingReady: true`. Do not print credentials.
3. Commit/push only `cms-testing`; its existing Vercel Preview deploys Next.
4. Check Preview admin access, headers and logs. Do not load-test production or
   exhaust real admin buckets for an automated verification.
5. A future production release still needs the compatible-reader rollout in
   [CMS-RICH-TEXT.md](CMS-RICH-TEXT.md), separate approval, and the live bindings
   deployed before the Next release.

Verified on 2026-10-14:

- `npm run cms:check`: 48 tests passed, including real ProseMirror pre-parse
  rejection, native rate-limit counters, auth/CSRF, outage recovery, independent
  source keys, rich-text validation, immutable history and publication retry.
- `npm run cms:proof`: passed against disposable local D1/R2 and a real Next
  production server. Draft privacy, rich-text publication, cache invalidation,
  retained media/history and content restoration succeeded without a rebuild.
  Repeated cached proof/homepage requests made zero Worker content reads.
- The same proof verified distinct admin/preview nonces on all framework scripts,
  the existing framing headers and absence of the new policy on public pages.
- `npm run typecheck`, `npm run lint` and `npm run build` passed.
- App and Worker `npm audit` each reported zero known vulnerabilities.
- Test Worker version `0ef871b9-4a07-40f6-850f-5e50afaf7821` deployed with both
  rate-limit bindings. The existing D1/R2 bindings and test upload origin were
  retained; no remote schema or content changes were made.

Lint is now available with ESLint 10 and typescript-eslint recommended rules,
both development-only. This requires Node 22.13+ on the Node 22 release line;
the project's tested local version is 22.16. The older Next ESLint preset was
not added because its dependency chain introduced an advisory and its React
plugin was incompatible with ESLint 10. No runtime dependency changed.

No remote content was edited for these checks. Production resources and `main`
remain unchanged.
