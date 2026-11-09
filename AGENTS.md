`<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Breeze project map

Read `docs/WEBSITE.md` before editing the website. It maps routes to `src/featured/`, full sections to `src/components/sections/`, reusable controls to `src/components/ui/`, and styles to `src/styles/`.
Read `codex.md` for the project's verification guidance.

Business details uses one continuous form with Contact information, Location,
Social profiles and Shared website text headings followed by divider lines.
Keep these fields and the shared-text subgroups visible without tabs or disclosures.

At 850px and below, Expand preview opens a full-screen native dialog with a
persistent top Cancel preview button. Its iframe fits the available screen width
and height; closing restores the editor and preserves unsaved changes. Desktop
expansion keeps the existing wider inline preview.

Preview headings and controls use an eye icon. The status, Save draft and Publish
changes bar is the last item below editing, preview and publishing details. Keep
it in normal page flow rather than pinned above the form.

## Login protection

Login now uses a browser-bound, one-use ten-minute email code. Only
nikodola@gmail.com, breezehc@gmail.com and ranahbeard@gmail.com are approved in
the server-only `src/lib/cms/email-settings.ts` list. Resend sends from
verification@nikodola.com. Emails use Resend's published admin-verification-code
template with String CODE;
optional RESEND_LOGIN_TEMPLATE_ID overrides its ID/alias. Template owns subject
and content. Keep expiry wording at ten minutes. Configure Next-only
RESEND_API_KEY and a separate
64-hex-character CMS_AUTH_SECRET per environment; credentials never go to the
browser or Worker. Shared passwords, Basic auth and old sessions no longer work.
Five failed code attempts lock source and inbox for one hour from the fifth
failure. Resends and retries do not reset or extend it; existing sessions consume
no attempts. Sends have persistent 60-second, five/hour source/inbox and 50/day
Worker-environment budgets. Missing delivery/protection fails closed. Apply
migrations 0007 and 0008, deploy the matching Worker, then Next. This is local
implementation pending owner Resend credentials and hosted rollout. See
`docs/CMS-EMAIL-LOGIN.md` for exact setup, release order and testing boundaries.

## Mandatory CMS text controls

One heading or sentence must use one editor field. If its design has colored
words or emphasis, use the shared rich text editor with Default and Breeze Orange
controls. Never create separate inputs for heading lines, highlighted words,
colors or fragments of the same sentence. Line breaks, punctuation and selected
word colors belong inside the one field. Reuse this control for all future CMS
work and preserve existing copy/formatting when converting old content.

Homepage > Hero edits its heading in one rich text field with Default/Orange
controls, plus introduction, manual Google rating/review count and button labels.
Homepage sections use one searchable **Select Section** combobox, numbered in
public page order (1. Hero, 2. Heating & cooling, etc.), instead of section buttons.
The homepage artwork remains fixed. Template version 3 adds the hero slot while
versions 1 and 2 remain readable; see `docs/CMS-HOMEPAGE-HERO.md` before changing
this contract or rolling out its Worker/Next readers.
