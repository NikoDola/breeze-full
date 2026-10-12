# CMS Preview verification — 2026-10-12

## Status

The deployed draft → immutable publication → Next cache invalidation → verified
HTML workflow passed, including recovery after the database commit. The extended
automated benchmark was interrupted by Vercel Security Checkpoint responses.
The user subsequently resolved browser access and confirmed the CMS editor opens
in Chrome. A mistaken-URL 404 report was withdrawn. No route or security setting
was changed in response. Additional browser publishing/performance tests were
stopped at the user's request to prepare the Sol handoff.

No project-wide automation token, firewall exception, paid upgrade, or protection
change was made. This is a working test foundation, not production admin access.

## Environment and isolation

- [Protected editor](https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app/admin-test)
- [Published proof](https://breeze-full-git-cms-testing-nikodolas-projects.vercel.app/cms-proof)
- Measured Next commit: `996466fe97bbbf7ed2b9f299310da12ef57e3955`.
- Measured deployment: `dpl_Ak3ogFWzaaHWmBTCTEvxHaSH1k44`, Node 22, Next 16.3.8,
  with actual function region `iad1` verified through deployed preflight.
- Test Worker: `breeze-test-api`, version `93c08c87-bdc5-476a-8252-f77125df32f8`.
- Test D1: `breeze-test-db`, `bc8cb3a4-bf92-4be6-82d0-84738ec3a381`, primary EWR.
- Production deployment remained `dpl_3Fbmjtr9gEfiTyTVTpTq9q7Gv3vD`.
- `main`/`origin/main` remained `17d24ec778c5b103c42eee6c3cbf7fbd8b322f48`.

Publications 7–12 occurred on the same Preview deployment without redeployment.
Later documentation/test-harness commits may create a new Preview; they are not
part of that no-redeployment test window. The original `breeze-db`, `breeze-api`,
homepage hero, form, existing page design, and production settings were untouched.
R2 was not created or used.

## Verified behavior

- Original `home-hero` content was read through the existing public GET endpoint.
  One original import is preserved in the test database.
- Deployed read-only preflight verified credentials, schema, Preview OIDC
  self-access, signed invalidation, branch/origin scope, and `iad1` before test
  writes were enabled. The checked-in Worker default remains writes-disabled.
- Draft content was absent from public HTML before publication.
- Publication creates an immutable revision and durable delivery record in one
  D1 transaction; repeating publication reuses the revision.
- A direct test-Worker publication simulated interruption after D1 committed.
  The protected Next retry confirmed the same revision in HTML.
- Six revisions on the measured build reached confirmed delivery: three ordinary
  publishes and three interrupted-delivery recoveries.
- Read-only audit: 11 revisions, 11 distinct draft versions, zero pending
  deliveries, one preserved import. Revision numbers start at 2.
- Missing authentication, cross-origin writes, unsigned invalidation, and an
  out-of-scope invalidation path were rejected.
- The Worker's only secret is `CMS_WRITE_TOKEN`. Next retains its HMAC key and
  short-lived Preview identity; no Vercel credential is sent to Cloudflare.
- The local workerd/D1 suite passed 16 tests. The local production-build proof
  passed two publication cycles and five cached requests with zero origin reads.

## Measured latency

Full HTTP response times from the user's test machine in North Macedonia. The
completed curl samples below each include a fresh HTTPS connection; they exclude
process startup and the deliberate pacing between requests. They are not a load
test or estimates for a US visitor with a reused browser connection.

| Measurement | Successful samples | Median | p95 |
| --- | ---: | ---: | ---: |
| Direct, uncached Worker + D1 API | 30 | 219.49 ms | 246.68 ms |
| Next page regenerated after invalidation | 30 | 755.97 ms | 850.47 ms |
| Cached Next page, before checkpoint interruption | 14 | 226.96 ms | 272.19 ms |
| D1 publication timestamp → verified HTML acknowledgment | 6 | 1,339.50 ms | 1,627 ms |

The publication row uses persisted Worker timestamps for revisions 7–12, including
three immediate manual-retry tests. It does **not** measure the entire browser
click-to-response time. Raw values: 1,142; 1,014; 1,537; 995; 1,564; 1,627 ms.
p95 uses nearest rank; with six or fourteen samples it is the maximum observed
value. The planned ten additional publication timing cycles did not run.

An earlier Node fetch run with connection reuse measured 30 direct requests at
148.95/164.07 ms median/p95 and 30 regenerated pages at 578.21/728.38 ms. Its cached
phase was also interrupted. Do not mix its samples with the curl measurements.

## Cache and Worker counts

| Phase | Successful page/API responses | Worker content requests observed | D1 public reads observed |
| --- | ---: | ---: | ---: |
| Direct Worker calibration | 30 | 30 | 30 |
| Regenerated Next pages | 30 | 30 | 30 |
| Completed cached responses | 14 | 0 | 0 |

All completed cached responses had `x-vercel-cache: HIT`. All 30 regenerated
responses had `REVALIDATED` or `MISS`. React request memoization now shares one
content read between metadata and page rendering, including with a fetch timeout.

Independent Cloudflare GraphQL analytics for
`2026-10-11T23:59:30.865Z`–`2026-10-12T00:00:00.000Z` reported one Worker invocation,
at `23:59:31Z`: the harness's known 404 log probe, which does not query D1. There
were no later invocations during the 14 cached responses and the checkpoint.
Together with HIT headers, this supports zero Worker/D1 content reads for that
window. These are test-window counts, not account billing totals. Adaptive
analytics and live logs are corroborating observations, not an unsampled audit
ledger. Earlier live tails dropped events; the completed 30/30 calibration and
30/30 regeneration phases did not.

## Benchmark interruption and remaining acceptance

Vercel returned HTTP 403 with `x-vercel-mitigated: challenge` and the security
checkpoint page. This occurred with Node fetch and later curl, including at a
slower request cadence. The cached curl phase completed 14 HIT responses before
its next request was challenged. Subsequent editor requests were also challenged
before reaching the application. No checkpoint response is counted as a cache
success or included in the successful-response latency distribution.

The Hobby plan does not support a system exception constrained to the Preview
domain and test IP. No broad bypass credential, project-wide rule, or upgrade was
created. The user selected a normal-browser check instead of a new CI runner.

The last confirmed test headline remains a `Recovery proof` marker. An attempted
restoration was stopped at the initial editor GET by the checkpoint, before any
draft or publication change. Restore the imported text after browser access is
available. Production content never changed.

The verified core workflow is ready to support visual editor development. The
planned 50-response uninterrupted benchmark and ten extra timing cycles are
incomplete; do not label them passed. The user confirmed browser editor access,
but an additional agent-driven browser publication cycle was not performed.
Production login/authorization, R2, backups/restore drills, and an
unattended delivery-retry runner remain separate work. Current recovery uses the
protected manual retry action and expiring leases.

## Reproduction and evidence

See [CMS-MILESTONE-1.md](CMS-MILESTONE-1.md) for configuration and commands. Ignored
artifacts: `.local/cms-preview-results.json`, `cms-preview-node-results.json`,
`cms-publication-audit.json`, `cms-publication-timings.json`,
`cms-cached-window-audit.json`, and `cms-proof-results.json`.

Relevant provider documentation:
[Cloudflare Worker metrics](https://developers.cloudflare.com/analytics/graphql-api/tutorials/querying-workers-metrics/),
[Vercel firewall layers](https://vercel.com/docs/vercel-firewall/firewall-concepts),
[domain/IP system bypass availability](https://vercel.com/docs/vercel-firewall/vercel-waf/system-bypass-rules).
