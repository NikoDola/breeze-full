# Service requests and analytics

## Housecall Pro

The client-supplied lead form replaces the shared service request form on Home,
Contact, Emergency, and seasonal promotion pages. Requests go directly through
Housecall Pro; the website does not store or email a second copy. Careers continues
to use the separate job application flow.

- React component: `src/components/sections/ServiceRequestForm.tsx`.
- Embed document: `public/integrations/housecall-pro.html`.
- Public form token: `c370368da67f40d6a0b374639708649e` (not an API credential).
- Existing `#service-form` and enclosing `#contact` anchors still work.
- The vendor script listens for a full window load. A dedicated iframe document
  gives it that lifecycle on every Next.js navigation and isolates its listeners.
- The bridge checks message source/origin and bounds heights. Redirects are limited
  to the website origin, Breeze's domains, and Housecall Pro's booking domains.
- A direct form link and telephone fallback remain available if the embed fails.
- CMS previews show a placeholder to avoid submitting real leads while editing.

### Loading and performance

The booking iframe is not included in the initial HTML. `ServiceRequestForm`
mounts it when the form comes within 200px of the viewport, when the visitor uses
Request service, or when a `#service-form` / `#contact` deep link targets it. A
manual load button and the direct booking/telephone links provide fallbacks.
The placeholder reserves the original 900px frame height; once loaded, the frame
stays mounted while scrolling so an unfinished request is retained. The existing
validated resize/redirect bridge remains in use. CMS previews never activate it.

Native `loading="lazy"` alone was not sufficient: the live homepage audit showed
the booking app, reCAPTCHA and Stripe running during initial page load. This
regression followed the Housecall Pro integration (commit `a524a23`). Deferring
the iframe prevents that entire dependency chain from competing with the hero.
Vendor cookie/storage warnings may still occur once the form is used; their
cross-origin code and browser privacy permissions are not modified by the site.

Regression checks:

- `node --test workers/cms/tests/service-request.test.mjs` checks deferred loading,
  scrolling, header actions, deep links, manual loading, resize validation and
  preview isolation without contacting the vendor or submitting leads.
- After `npm run build`, `node scripts/check-performance.mjs` checks generated
  HTML for early vendor loads, hero preloads, route stylesheet budgets and a
  homepage HTML size budget. It does not report a Lighthouse score.

The existing external stylesheet strategy is retained. On this build, global
CSS inlining increased gzipped homepage HTML from about 9.5 KB to 46 KB, and
inner-page HTML to about 78 KB. Graph chunking added a homepage stylesheet request
without reducing CSS bytes. Neither experiment improved the asset budget, so
neither is enabled. The homepage still excludes interior and admin styles.

Fields, required settings, styling inside the hosted form, notifications and CRM
routing are controlled in Housecall Pro. Website select styling cannot change
cross-origin form fields. Service-card links scroll to the form but cannot prefill
its service field through the old website-only select handler.

Before client launch, submit one agreed test lead and have the client confirm it
arrives in the intended Housecall Pro inbox/pipeline. No automated check submits
customer leads. A real CRM delivery has not been verified from this workspace.

## Microsoft Clarity

Project `yqwuzc6zfj` is installed in the public layout through
`src/components/analytics/ClarityProvider.tsx`. It is enabled only when
`VERCEL_ENV=production`; local development, Vercel Preview, and CMS routes do not
load it. Set `CLARITY_ENABLED=false` and redeploy to disable it in production.

The visitor must choose **Allow analytics** before the tag is loaded. The choice
is saved as `breeze.analytics-consent.v1` in local storage. The footer's **Privacy
choices** button lets the visitor change it. Grant queues Consent API v2 with
`analytics_Storage: "granted"` and `ad_Storage: "denied"`. Withdrawal sends both
as denied and reloads the page so the existing script stops running. If browser
storage is unavailable, the choice lasts for the current visit only.

Clarity cannot record the contents of the third-party Housecall Pro iframe. The
service request container is also marked for masking. Default input masking is
retained. Review project masking settings in Clarity before launch.

The privacy page includes a code-managed integration disclosure in addition to
its CMS content, so an existing published CMS document cannot hide the new
disclosure. The client should review that wording against its actual practices.

After production deployment, grant analytics on the public site and confirm
activity in the client's Clarity dashboard. Dashboard ingestion has not been
verified from this workspace. Preview deployments intentionally cannot prove
production analytics collection.
