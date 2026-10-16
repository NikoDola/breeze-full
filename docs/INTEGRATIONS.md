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
