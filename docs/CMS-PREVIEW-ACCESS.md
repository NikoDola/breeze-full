# Preview access investigation — 2026-10-11

## Verified results

No project-wide automation bypass token was created. The project's OIDC federation is already enabled. The existing local Vercel development OIDC token was sent only in the `x-vercel-trusted-oidc-idp-token` request header:

| Read-only request | Result |
| --- | --- |
| `cms-testing` Preview homepage without credentials | 302 to Vercel sign-in |
| Same homepage with development OIDC | 200, `x-vercel-cache: HIT` |
| Preview `/admin-test` with OIDC on the initial deployment | Application 404 because that deployment predates CMS environment configuration |
| Protected production deployment without credentials | 302 to Vercel sign-in |
| Same production deployment with development OIDC | 403 |

These checks prove the local development-to-Preview boundary in the current project. They do not yet prove a deployed Preview function's self-access; that must be tested during the implementation. No production mutation was attempted.

A temporary alias-scoped share credential was created, tested with `x-vercel-protection-bypass`, and rejected with a 302 to sign-in. It was revoked. Shareable links are documented as query-string/browser sharing; we should not build server callbacks around browser cookies or undocumented headers.

## Automation bypass scope and risk

Vercel documents automation secrets as valid across all deployments of a project. The current OpenAPI schema has create/revoke/note/environment-variable-selection fields, but no branch, environment, path, method, or deployment restriction for these secrets. Saving one only in Preview environment variables restricts distribution, not its authority.

A bypass secret permits requests through deployment protection, including requests to protected production deployment URLs and application APIs. It does not itself grant Vercel management API access, deployment creation, environment-variable management, D1 access, or R2 access. However, requests can use POST and other mutating methods; application authentication must still protect those endpoints. Therefore it cannot be described as read-only or incapable of affecting production.

The current `main` revision retains the legacy admin endpoints and fallback password; their removal is on `cms-testing`. Filesystem write attempts may fail in Vercel's runtime, but that is not an authorization boundary. No production write was tested.

Pinning a callback URL and retaining separate HMAC secrets prevent accidental misrouting and unauthenticated cache purges. They do not constrain what a stolen project-wide bypass credential can reach. Giving such a credential to the test Worker would violate the intended separation.

## Recommended flow: Next owns invalidation

1. The protected Preview editor authenticates the user and validates Origin, host, body, and expected draft version.
2. Its Next server handler publishes through the test Worker, which atomically commits the immutable revision, publication pointer, and durable delivery record in test D1.
3. After the commit succeeds, that same Next handler invokes the fixed page's `revalidateTag(tag, { expire: 0 })` and `revalidatePath('/cms-proof')` directly.
4. For HTTP warming and HTML revision verification, the Next function obtains its current identity through `getVercelOidcToken()` from `@vercel/oidc`. It calls only the configured Preview origin and forwards that short-lived token in `x-vercel-trusted-oidc-idp-token`. Redirects remain disabled.
5. Next records invalidation and confirmed HTML delivery separately through an authenticated test Worker acknowledgment endpoint. A failure leaves the durable job pending; retry is idempotent.

The Worker needs **no Vercel credential**. Local performance tests use their own development OIDC identity. Default Vercel self-access permits Preview-to-Preview and development-to-Preview; it does not permit either to production. This is an environment boundary, not a single-branch boundary. Keep the CMS variables scoped to `cms-testing`, enforce the exact host and callback destination, and keep the current production fail-closed checks.

### Retry tradeoff

Moving delivery to Next requires changing the existing Worker-owned retry flow. For the milestone, the editor can retry pending delivery through the protected Next handler, including after an interrupted publication. A robust unattended retry needs a trusted runner with Preview-only OIDC access. Vercel Cron runs against production deployments, so it cannot simply replace the Worker cron in this Preview.

Do not mark delivery confirmed merely because the cache API returned successfully, or acknowledge the outbox before invalidation. Do not claim unattended recovery until its runner is implemented and tested. Worker cron must not keep attempting the old protected callback when operating in the proposed Next-owned delivery mode.

## Alternatives

| Option | Tradeoff |
| --- | --- |
| External OIDC Trusted Source, restricted to Preview and exact issuer/audience/workload claims | Preserves autonomous Worker callbacks, but a Cloudflare Worker is not automatically a Vercel-trusted OIDC issuer. Adds identity issuance/discovery/JWKS, key rotation, and operational work. |
| Separate Vercel project containing only test deployments | Strong resource isolation and preserves the existing push callback architecture; requires another project/configuration. A project-wide bypass there cannot bypass the existing production project's protection. |
| Exception for only the `cms-testing` Preview domain | Leaves production protection unchanged and keeps application Basic/HMAC checks, but removes Vercel's outer protection from the entire Preview domain. Latest dedicated Vercel docs say exceptions are available on all plans; actual account capability should be checked before choosing this. No exception was added. |

## Sources

- [Vercel Trusted Sources](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/trusted-sources)
- [Automation bypass](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation)
- [Preview-domain exceptions](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/deployment-protection-exceptions)
- [Shareable links](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/sharable-links)
- [OIDC reference](https://vercel.com/docs/oidc/reference)
- [Cron jobs](https://vercel.com/docs/cron-jobs)
- [Vercel OpenAPI schema](https://openapi.vercel.sh/)

The Next cache calls were checked against the installed Next 16.3.8 documentation before making this proposal.
