# Breeze website: Vercel launch and client handover

Prepared 26 October 2026. These instructions are based on the checked-out project and current official Vercel documentation. They do not confirm the current state of the online accounts. No hosting, DNS, credentials or production content were changed while preparing this guide.

## Start here: this project already records a Vercel deployment

The repository records the production website at `https://breeze-full.vercel.app`, with `main` as its production branch. Check that project in your Vercel dashboard before creating another one. Reusing it avoids unnecessary migration work.

There are two parts to keep running:

| Service | What it does | Existing live resources in the project |
| --- | --- | --- |
| Vercel | Runs the Next.js website, admin interface and publishing refresh | Existing `breeze-full` deployment; Node.js 22.x; `main`; `iad1` region |
| Cloudflare | Runs the CMS API, stores editable content and stores uploaded photos | Worker `breeze-live-api`, D1 `breeze-live-db`, private R2 `breeze-live-assets` |

**Important project-specific step:** CMS authentication currently accepts the exact origin `https://breeze-full.vercel.app`. Publishing also checks one specific Vercel project ID. Connecting a domain alone does not enable the CMS on that domain; creating a different Vercel project also needs a matching code update. Complete step 4 before directing the client to a new admin address.

## 1. Agree ownership and collect access

1. Confirm the client's final domain, who renews it, and who can edit its DNS records. The website's metadata already uses `https://www.breezehc.com`; use this only if the client confirms that is the launch domain.
2. Agree whether you will manage hosting for the client or the client will own the Vercel team. Client ownership with your continuing access is a practical long-term handover arrangement.
3. Use a Vercel plan that permits commercial use. Hobby is for personal, non-commercial projects; Pro is the usual starting point for a business site. Confirm current billing and any member charges before choosing the team. [Vercel plan guidance](https://vercel.com/docs/plans/hobby).
4. Record who owns the Git repository, Cloudflare CMS resources, Housecall Pro and Microsoft Clarity. Access to Vercel alone does not transfer those separate services.
5. Have the client invite you through the relevant account's access controls where available. Keep the admin login and hosting secrets in a private password manager.

## 2. Back up the website and CMS

1. Save the currently deployed Git commit and Vercel deployment reference.
2. Export the live D1 database and make a verified backup of live R2 assets before origin, account or storage changes. Keep these private and outside the repository.
3. Export or screenshot the current domain DNS records, including records for email.
4. Agree who will maintain backups, renew the domain and handle future support. A Vercel code rollback does not roll back CMS content or photos.

## 3. Open the existing Vercel project, or import only if necessary

**If the existing project is available:** open it and inspect its Git connection, latest production deployment, environment variables and domain settings. You do not need a second import simply to add a domain.

**If a new project is necessary:** in the correct Vercel team, choose **Add New / New Project**, connect GitHub, import the website repository and use these settings:

| Setting | Value for this website |
| --- | --- |
| Framework preset | Next.js |
| Root directory | Directory containing this project's `package.json`; `./` if it is the repository root |
| Production branch | `main` |
| Node.js | 22.x, matching `package.json` |
| Install command | Default npm installation; do not replace it without a reason |
| Build command | `npm run build` |
| Output directory | Next.js default; do not set an `out` folder |
| Function region | Preserve `iad1`, already declared in `vercel.json` |

This CMS needs server routes; do not convert the website to a static export. Keep Vercel's system environment variables available, because the CMS checks the environment and Git branch. The branch must remain `main` unless the code's scope checks are deliberately updated. [Git deployment instructions](https://vercel.com/docs/git), [system environment variables](https://vercel.com/docs/environment-variables/system-environment-variables).

**If transferring an existing project to the client's team:** use **Project Settings > General > Transfer Project** and review Vercel's transfer summary. Recheck repository access and integrations afterward. A Vercel transfer does not move Cloudflare data; do not assume the project identity or preview hostname is unchanged. Check both before release. [Project transfers](https://vercel.com/docs/projects/transferring-projects).

## 4. Align the CMS with the final hostname and Vercel project

This is developer work. Make one coordinated release; the client should not edit these files.

1. Choose one exact HTTPS origin for the live admin and publishing checks. Recommended for a single-domain handover: the confirmed primary public origin, for example `https://www.breezehc.com`. Use the same spelling everywhere and no trailing slash.
2. Update `LIVE_ORIGIN` in `cms/shared/contract.ts`. It is consumed by Next.js scope/authentication and the Cloudflare live-environment gate. Preserve exact-origin checks rather than allowing arbitrary hosts.
3. Set Vercel Production `CMS_LIVE_ORIGIN` to exactly that value.
4. Set the live Worker's `CMS_UPLOAD_ORIGIN` in `workers/cms/wrangler.live.jsonc` and its deployed configuration to exactly the same value.
5. Verify the real Vercel project ID in Project Settings. `src/lib/cms/delivery.ts` currently requires `prj_w0vgYQ8eOEMOt6ftAqPcaPRu8rTV`; update that explicit check if the project ID differs. Keep the production-environment check.
6. If Cloudflare ownership or the Worker URL changes, migrate and verify the data separately, then update `LIVE_WORKER_ORIGIN` in `cms/shared/contract.ts`, `CMS_WORKER_URL` in Vercel and the live Wrangler bindings. Review `next.config.mjs` image-host handling. Never point production at test storage.
7. Review the public origin in `src/featured/site/layout.tsx`, `src/featured/seo/sitemap.ts` and `src/featured/seo/robots.ts`. All currently use `https://www.breezehc.com`; change them if the chosen domain differs. Review legal links and `src/lib/integrations/housecall-pro.ts` if the business domain is different.
8. Build and run the project's CMS checks after these code/configuration changes: `npm run build` and `npm run cms:check`. Follow `docs/CMS-CLIENT-LAUNCH.md` and the image rollout documents when releasing compatible Worker and Next.js changes.

Alternative: the public site can use a custom domain while the client continues using the existing, approved Vercel admin origin. If you choose that arrangement, retain the existing CMS pins, give the client that exact admin link, and verify a publication on the actual custom-domain website. Do not tell the client that `/admin` on the new domain is ready without testing it.

## 5. Check Production settings and Cloudflare readiness

In Vercel **Project Settings > Environment Variables**, scope these to **Production**. Retrieve real secret values privately from your existing operator configuration; this guide intentionally contains no passwords or tokens.

| Variable | Required setting |
| --- | --- |
| `CMS_LIVE_ENABLED` | `true` for the live CMS |
| `CMS_LIVE_ORIGIN` | Exact approved live admin/publishing HTTPS origin, matching code |
| `CMS_LIVE_USERNAME` | Client's agreed username |
| `CMS_LIVE_PASSWORD` | Strong, unique client password; generate at least 32 characters |
| `CMS_WORKER_URL` | Exact live Worker URL; currently `https://breeze-live-api.nikodola.workers.dev` |
| `CMS_WRITE_TOKEN` | Strong live-only secret, matching the live Worker's secret |
| `CMS_REVALIDATE_SECRET` | Separate Next-only random secret, at least 32 characters |
| `CMS_TEST_ENABLED` | `false` or unset in Production |
| `CMS_PROOF_ENABLED` | `false` or unset in Production |
| `CLARITY_ENABLED` | `true` if the client wants the installed consent-based analytics; `false` disables it |

Use distinct values for the password, write token and revalidation secret. Never prefix secrets with `NEXT_PUBLIC_`. Leave Preview credentials and resources separate. Environment-variable changes take effect on a **new deployment**, so redeploy after editing them. [Vercel environment variables](https://vercel.com/docs/environment-variables).

For Cloudflare, confirm:

- Worker is `breeze-live-api`, with `CMS_ENVIRONMENT=live`, the exact `CMS_UPLOAD_ORIGIN`, and the matching `CMS_WRITE_TOKEN` secret.
- D1 binding is the live database and R2 binding is the live private bucket. Existing published content and uploaded photos are present.
- The current code needs migrations through `0006_hero_media.sql`; inspect the applied migration history and apply only missing migrations after backup. Existing documentation of an older release is not proof that the newest migrations are installed.
- R2 remains private. Media delivery is handled through the existing application.
- `CMS_WRITES_ENABLED` is deliberately controlled. The checked-in live config defaults to `false`; deploying it without a deliberate override will stop client saves/uploads/publishing. Preserve the intended live setting, or use a planned temporary editing pause for coordinated updates.

For a new CMS setup, deploy the compatible live Worker first with writes disabled. Deploy Next.js, run authenticated preflight, then enable writes deliberately and perform acceptance checks. For an existing live site, plan any editing pause with the client. Do not blindly redeploy the default test Worker configuration.

Publishing uses Vercel OIDC. Verify **Settings > Security > Secure Backend Access with OIDC Federation** is enabled and the project's production-to-production self-access works. Keep Preview isolated. [Trusted Sources and OIDC](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/trusted-sources).

## 6. Prepare the domain in Vercel

1. Open the correct Vercel project, then **Settings > Domains > Add Domain**.
2. Add the confirmed root domain and its `www` hostname, for example `breezehc.com` and `www.breezehc.com`.
3. Choose the primary hostname. If using the existing metadata, serve the site on `www.breezehc.com` and redirect the root hostname to it. Do not redirect both directions.
4. Copy the exact DNS record instructions shown for each domain. Values are project-specific; do not copy an old generic Vercel IP or CNAME from a tutorial.

[Vercel custom-domain setup](https://vercel.com/docs/domains/working-with-domains/add-a-domain).

## 7. Give the client these DNS instructions

You can copy this message after inserting the real values from Vercel:

> To connect your domain, open the account where your domain's DNS is managed and find DNS settings. I'll send you the exact website records from Vercel. Update the root-domain website record and the `www` record with those values. Please keep your email records in place and send me a screenshot when the changes are saved. Your domain can stay with your current provider.

Use this as a record map, not as literal DNS values:

| Purpose | Typical type | Name / host | Value |
| --- | --- | --- | --- |
| Root website | A | `@` or blank, depending on provider | Exact value shown in this project's Vercel domain panel |
| www website | CNAME | `www` | Exact value shown in this project's Vercel domain panel |
| Ownership verification, only if requested | TXT | Exact name shown by Vercel | Exact verification text shown by Vercel |

1. Identify the authoritative DNS provider; it may be different from the registrar where the domain was purchased.
2. Save a copy of existing records. Replace only conflicting website records for the root/`www`; inspect old A, AAAA or CNAME records that could send visitors to the previous host.
3. Preserve MX records, email-related TXT records such as SPF/DKIM/DMARC, and unrelated subdomains. Changing the website host does not move email hosting.
4. Keep existing nameservers for this route. If deliberately moving nameservers instead, first copy the entire required DNS zone, including email and verification records.
5. If Vercel requests a verification TXT record, add it exactly as displayed.
6. Return to Vercel's domain panel and check the configuration status. DNS changes may take time according to the old records' TTLs; do not promise an exact completion time.

[Vercel DNS migration guidance](https://vercel.com/kb/guide/zero-downtime-migration), [domain troubleshooting](https://vercel.com/docs/domains/troubleshooting).

## 8. Complete the coordinated release and HTTPS checks

1. Coordinate the origin/code/Worker updates with the DNS cutover. Exact-origin checks mean the old admin hostname may stop accepting sign-in once the new-origin release is active. Avoid content editing during this window.
2. Deploy the intended commit on `main` with the final Production variables. Preserve the previous deployment for recovery.
3. Confirm both domain entries are correctly configured and the primary site opens with HTTPS. Vercel issues certificates automatically once domain validation succeeds. [Vercel HTTPS](https://vercel.com/docs/domains/working-with-ssl).
4. Check the root-to-primary redirect, including an interior URL. Confirm the site is public without a Vercel account while admin sign-in remains protected.
5. Run the CMS authenticated preflight against the approved origin. The existing endpoint is `POST /api/cms/editor?pageId=home` with the authenticated session, `x-cms-request: editor` and JSON `{"action":"preflight"}`. Use operator tooling; do not put credentials in the client PDF.
6. Enable writes deliberately after readiness checks. Try the acceptance checklist below on the final public/admin hostnames.

## 9. Complete acceptance with the client

- [ ] Homepage, services, promotions, gallery, contact and legal pages load on the final domain.
- [ ] Mobile navigation, phone links, email links and map directions work.
- [ ] `/sitemap.xml`, `/robots.txt` and page metadata use the chosen primary domain.
- [ ] Admin sign-in and sign-out work at the agreed address. Logged-out visitors cannot edit content.
- [ ] Save a small agreed draft: it stays private. Publish it: status confirms **Live on website** and the final public page shows the update. Restore the original wording through another publication if this was a test.
- [ ] Upload an agreed sample image, select it and verify preview/publishing where appropriate. Do not replace client content without agreement.
- [ ] If a publication refresh is interrupted, **Publishing details > Retry website update** completes the same saved publication.
- [ ] Submit one agreed service enquiry and ask the client to confirm receipt in Housecall Pro. The website does not store or send a second copy.
- [ ] Check the Careers email flow: it prepares an email in the visitor's email app, which the visitor must send.
- [ ] On the public production site, allow analytics and confirm activity in the client's Microsoft Clarity dashboard if analytics is enabled.
- [ ] Ask the client to make one small content change using the PDF guide during your handover call.

Housecall Pro lead receipt and Clarity dashboard ingestion are specifically marked as unverified in the repository's integration notes. Treat them as launch checks to complete, not as already passed.

## 10. Hand over access and ongoing responsibilities

Send the client:

- Final public website link and exact confirmed admin link.
- Username and password through a private channel, separate from the public PDF.
- `breeze-client-cms-guide.pdf`, a short walkthrough and your support contact.
- Ownership/access details for the domain, hosting, Housecall Pro and Clarity; clarify whether you manage Cloudflare on their behalf.
- Agreed renewal, billing, backup and maintenance responsibilities.

The CMS currently uses one shared client account. It has no individual user accounts, roles or self-service password reset. Password changes are a developer task; rotating the Production password and deploying the updated configuration invalidates existing sessions. Avoid simultaneous edits to the same page.

For a website-code problem, Vercel rollback can restore the prior deployment. For a content problem, correct the page and republish, or have the developer recover a retained revision. For DNS problems, use the saved DNS records. Never treat a code rollback as a database or photo restore.
