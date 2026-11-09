# Breeze email-code login

Implemented locally on 9 November 2026. Hosted deployment and a real Resend
delivery check are still pending. No verification emails were sent by the tests.

## Who can sign in

Only these exact email addresses are approved:

- nikodola@gmail.com
- breezehc@gmail.com
- ranahbeard@gmail.com

Capitalization and surrounding spaces are normalized. Aliases, plus-addresses,
other addresses at the same domain and public registration are not enabled.
The server-only list is in `src/lib/cms/email-settings.ts`. The form never receives
that list. Removing an address there also rejects its existing sessions after
the updated server is running.

The sender is fixed to **Breeze admin <verification@nikodola.com>**, with replies
going to nikodola@gmail.com. All three approved inboxes get the same Breeze CMS
editing access. There is no user-management screen or separate permission roles.

## What the owner needs to do

1. In Resend, open **Domains**, add `nikodola.com`, and copy the DNS records Resend
   supplies to the DNS provider for that domain. Wait for the sending domain to
   show **Verified**. Preserve existing mailbox/MX settings; use the exact sending
   DNS records Resend supplies. A paid mailbox for verification@nikodola.com is
   not required just to send these codes.
2. Create a Resend API key with **Sending access**, restricted to `nikodola.com`.
   Save the value privately. The account's sample `onboarding@resend.dev` sender
   cannot replace domain verification for the three client inboxes.
3. For local Breeze testing, fill the existing blank value in
   **`breeze-web/.env.local`**:

   ```dotenv
   RESEND_API_KEY=re_your_actual_private_key
   ```

   A new `CMS_AUTH_SECRET` has already been generated in that same local file.
   Existing configuration was preserved. Restart Breeze's `npm run dev` so the
   new environment values load. Never paste either secret into chat or Git.
4. For a future hosted release, add **Production-only** `RESEND_API_KEY` and
   `CMS_AUTH_SECRET` to the Breeze Vercel project. Use a separate new 64-character
   hex secret for Production. Generate one locally with:

   ```powershell
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Save it as a Secret in Vercel. Keep the matching live `CMS_WRITE_TOKEN`,
   `CMS_WORKER_URL`, `CMS_REVALIDATE_SECRET`, `CMS_LIVE_ORIGIN` and
   `CMS_LIVE_ENABLED=true`. Keep test mode disabled in Production.
5. Apply the database migrations and deploy the updated Worker **before** the
   matching Next.js release, using the rollout section below. A Vercel environment
   edit alone does not update an existing deployment.
6. After configuration/release, open `/admin-test/login` in the exact configured
   origin. Enter one approved email, click **Send verification code**, check that
   inbox (and Spam), and enter its six-digit code in the same browser. Sign out
   after testing. One genuine successful sign-in is sufficient; do not deliberately
   exhaust a real client's lockout or send quota.

For Preview, configure separate Preview `CMS_AUTH_SECRET` and preferably a separate
domain-restricted Resend key; preserve the existing `cms-testing` branch scope,
test origin and test Worker URL. The local secret is not a Production recovery key.

Official references:
[Resend domains](https://resend.com/docs/dashboard/domains/introduction),
[API keys](https://resend.com/docs/dashboard/api-keys/introduction),
[Vercel environment settings](https://vercel.com/docs/environment-variables/managing-environment-variables).

## Client flow and limits

- Enter an email, receive a code, then choose **Verify and sign in**. Passwords
  and the former Basic-auth route no longer authenticate. Old password sessions
  are invalidated by the new session version; everyone signs in with email again.
- Codes expire in ten minutes, are tied to the requesting browser and inbox,
  and are consumed atomically once. New delivered codes replace older codes for
  that browser/inbox; other browsers retain their own pending sign-in.
- Five failed verification attempts within an hour lock that source and inbox
  for one hour from the fifth failure. Further guesses and requests do not extend
  the lock. Resends, refreshing, changing source IP, or signing out do not clear
  the inbox's failure count. Successful verification before lockout clears the
  relevant source/inbox failures. Existing signed-in editing uses no attempts.
- Sending is limited to one code per minute and five per hour for each source
  IP and each inbox, plus 50 per UTC day per Worker environment. These limits are
  independent of verification failures and persist across restarts. Local requests
  share a single loopback source bucket; users on one network can share a bucket.
- The Resend Free quota is shared by all usage in that Resend account. This app's
  daily cap is not an account-wide guarantee if other applications also send mail.
- Sessions last eight hours and use signed HttpOnly, SameSite=Strict cookies,
  with Secure and the __Host- prefix on HTTPS. The session contains the verified
  email, expiry and a random nonce, not codes or signing secrets. Rotating the
  auth secret or write token invalidates sessions.
- Unknown emails get a generic response and no email. Only an approved email
  with a valid, delivered code can get a session. Delivery and protection outages
  fail closed. A send timeout is never automatically retried; its code is disabled.

## Server configuration and storage

`CMS_AUTH_SECRET` is a dedicated Next-only 64-hex-character random secret. It keys
the session signatures and purpose-separated code/browser/email hashes. Never
use `NEXT_PUBLIC_` for it or `RESEND_API_KEY`. The Worker receives neither secret
nor plaintext verification codes; Next calls the fixed Resend HTTPS API directly.
The three approved addresses and sender are server-side code settings, so no
`ADMIN_ALLOWED_EMAILS` variable is needed for Breeze. That root setting still
belongs to the separate business dashboard.

`CMS_TEST_USERNAME`, `CMS_TEST_PASSWORD`, `CMS_LIVE_USERNAME` and
`CMS_LIVE_PASSWORD` are retired for Breeze after this release. They may remain
in old private configurations, but the new app never authenticates with them.

Migration `0008_email_login.sql` adds separate challenge and send-budget tables
in the existing CMS D1 database and uses migration 0007's persistent failure
table. It changes no website content, drafts, publications or media. Codes and
browser secrets are stored only as HMAC hashes. Atomic D1 transactions reserve
sends and consume codes, including simultaneous requests. Failed/uncertain sends
retain their quota reservation and cannot authenticate. Old challenge/budget rows
are cleaned up when new requests arrive. General traffic limits remain separate.

## Hosted rollout

From `breeze-web/workers/cms/`, after the release is authorized:

```powershell
# Preview
npx wrangler d1 migrations apply DB --remote --config wrangler.jsonc
npx wrangler deploy --config wrangler.jsonc

# Production - separate target; run only for the intended live release
npx wrangler d1 migrations apply DB --remote --config wrangler.live.jsonc
npx wrangler deploy --config wrangler.live.jsonc
```

These Wrangler configs default to content writes disabled. Preserve the target's
existing deliberate write flag and secrets when deploying. Login itself also
works with content writes disabled. Check the authenticated Worker health
response reports `emailLoginReady: true` (table presence), then release the matching
Next.js source/environment. Never deploy Next before the new Worker endpoint is
ready. Local migrations 0007 and 0008 have been applied after private backups.

Remote acceptance scripts now require an existing verified-email Preview cookie
in the private `CMS_PROOF_SESSION_COOKIE` setting, including its cookie name.
They no longer use Basic credentials. The isolated local proof uses a generated
test session secret and disposable databases; no authentication bypass is exposed
by the application. Keep session cookies out of source control and logs.

## Verification

Completed locally on 9 November 2026: 39 main security/CMS workflow checks passed,
followed by the final 15 email/session checks including two added HTTPS-cookie and
uncertain-activation regressions. Next and Worker TypeScript checks, lint for the
changed source files, acceptance-script syntax checks and the isolated Next
production build passed. Local Worker health returned 200 with emailLoginReady
and schemaReady true. Migration 0008 and local database integrity were verified.

Automated checks use generated secrets, disposable local D1 databases and a
mock Resend transport. They cover all three approved inboxes, unknown inboxes,
cross-browser/identity attempts, exact expiry, one-use/concurrent verification,
five-failure lockout, resend and hourly/daily budgets, provider errors/timeouts,
secret rotation, CSRF, cookies, and rejection of the old password/Basic paths.

Real DNS verification, Resend sending permission and inbox delivery can only be
confirmed after the owner adds their API key. Automated success does not prove
that production credentials or DNS are configured.
