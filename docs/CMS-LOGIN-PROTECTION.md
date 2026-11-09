# Breeze login protection

This records the 8 November password-lockout implementation. The current local
login flow was replaced on 9 November by [CMS-EMAIL-LOGIN.md](CMS-EMAIL-LOGIN.md):
approved email codes, no Basic/password bypass, source/inbox failure locks and
separate send budgets. Use that newer guide for setup and rollout.

Implemented locally on 8 November 2026. This change has not been deployed to
hosted Preview or Production.

## Client behavior

- Five failed password attempts from the same source IP within one hour trigger
  a one-hour lock, starting with the fifth failure. That fifth response and further
  attempts return HTTP 429 with the remaining wait in `Retry-After` and a readable
  minute count. Even a correct password is blocked until the hour ends.
- The lock expires automatically. Retrying does not extend it. A successful
  sign-in before the fifth failure clears the previous failures. Fewer than five
  failures expire one hour after the first failure in that window.
- Refreshing, closing the browser, changing usernames, or signing out does not
  reset a lock. The login form and legacy Basic requests use the same counter.
- Signed-in sessions keep their existing eight-hour lifetime. Opening pages,
  previews, saving, publishing and signing out do not consume password attempts.
- People on the same public IP share a bucket. All local loopback requests share
  one bucket. Other IPs have independent counters; this is not a global account
  lock or protection against a distributed botnet. MFA is not added here.

## Enforcement and storage

Next validates the existing credentials server-side and sends only a validity
boolean and an HMAC source key to `POST /api/admin/auth/login`. This endpoint
requires the Worker bearer secret, rejects browser Origins, caps the body at
256 bytes and accepts only those two fields. It works when content publishing
is disabled. No password, username, raw IP or session cookie is stored in the
login-attempt table or logged by this feature.

The D1 `cms_login_attempts` table persists failures and lock deadlines across
browser and server restarts. An atomic upsert accounts for simultaneous requests;
correct credentials cannot clear an active lock. Expired rows older than one day
are cleaned up as new attempts arrive. Test/live databases and scope keys remain
separate. Rotating the write secret changes source keys as well as session keys.

If the login endpoint, trusted source metadata, migration or database is
unavailable, new password authentication returns 503 and creates no session.
It never silently falls back to unlimited guesses. Already signed-in requests
retain the existing general limiter and authorization behavior.

The 120-request/minute admin limiter and 600-request/minute direct Worker limiter
remain in place independently. Their approximate counters and availability policy
do not replace this persistent password-attempt rule.

## Rollout

The local D1 files were backed up under `backups/before-login-lockout-20261108-164202/`
and migration 0007 was applied locally. The existing local dev servers pick up
source changes; restart `npm run dev` if a separately launched Worker is stale.

For a future authorized hosted release, run these from `workers/cms/`, preserving
the environment's existing flags and secrets:

1. Apply the migration to the intended environment:
   - Preview: `npx wrangler d1 migrations apply DB --remote --config wrangler.jsonc`
   - Production: `npx wrangler d1 migrations apply DB --remote --config wrangler.live.jsonc`
2. Deploy the matching Worker config before releasing the Next.js changes.
3. Release the matching Next.js deployment. Do not deploy Next first: the new
   login endpoint must be available or new sign-ins will return 503.

Do not exhaust the real client's login bucket to test a deployment. The automated
tests use isolated D1 databases and generated credentials.

## Verification

Completed locally on 8 November 2026: all 17 focused security tests passed;
Next and Worker TypeScript checks, lint for the changed source files and the
isolated Next production build passed. The migrated local database passed an
integrity check. No real login bucket was exhausted and no content was published.

Focused tests cover the fifth failure, the exact one-hour boundary, successful
reset, old failure expiry, independent sources, simultaneous requests, no deadline
extension, origin/token validation, legacy Basic sharing, ordinary session access,
sign-out, spoofed forwarding headers and fail-closed outages/malformed replies.

Run from `workers/cms/`:

```text
node --test tests/login-lockout.test.mjs tests/session.test.mjs tests/security.test.mjs tests/throttle.test.mjs
```
