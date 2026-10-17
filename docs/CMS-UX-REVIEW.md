# Client admin usability review

Reviewed 2026-10-16 in the existing, signed-in local `/admin-test` browser tab.
Inspected Services, Homepage, Global settings, Reviews, Gallery and its photo
picker, plus the editor and preview implementation. No content was edited,
saved or published during the review. Production and mobile behavior were not tested.

## Implementation status (2026-10-16)

The admin interface now uses clearer form ownership text, preview loading and retry
states, one save/publish toolbar, shorter navigation, section-aware homepage
previews, a direct gallery photo picker, grouped fields, and clearer review
controls. Publishing an edited page first saves its draft with version protection.
`npm run build` passes. A signed-in visual pass is still needed to confirm page
switching, preview rendering, mobile layout, and keyboard behavior. The local
blank-preview cause observed during the initial review was not established.
Field-specific validation messages and automatic focus on invalid fields remain
follow-up work; save errors still appear in the editor notice.

## 1. Correct form ownership and outdated instructions — first

**Observed:** Global settings still says “Form recipient email” receives service
requests and careers applications, and that forms open the visitor's email app.
Service requests now use Housecall Pro. This could cause the client to change an
email address here and expect CRM notifications to change.

**Change:** Rename the field to “Job application email” and explain its actual
scope. Add a concise “Service request form” entry explaining that form fields,
SMS preferences and lead notifications are managed in Housecall Pro. Provide a
link to its login and short instructions for reaching lead form settings. A
similar Clarity entry can link to reports and say tracking requires visitor
consent on production. Do not show a verified connection status unless it was
actually verified.

**Files:** `src/featured/admin-test/CollectionFields.tsx`,
`src/featured/admin-test/HomeFields.tsx`, `docs/WEBSITE.md`.

**Done when:** No admin text implies the service form sends email through the
visitor's mail app. The client can identify where to change service form fields.

## 2. Make preview state accurate and recoverable — first

**Observed:** Services initially had a rendered preview. After switching pages,
Homepage, Global settings, Reviews and Gallery showed blank navy preview panels;
their iframe accessibility state remained `about:blank` during inspection. The
green “Live” badge remained visible. This was observed locally; the cause and
production impact are not established.

**Change:** Investigate navigation/iframe loading first. Track a real preview
ready acknowledgment, show “Loading preview,” and offer “Reload preview” with a
clear error if readiness fails. Never display a ready indicator before the
frame responds. Replace “Live” with “Draft preview” or “Published version” to
match the selected mode; preview readiness and publication status are separate.
Only describe a publication as visible on the website after delivery confirmation.

**Files:** `src/featured/admin-test/HomePreviewFrame.tsx`,
`src/featured/admin-test/Editor.tsx`, the preview components.

**Done when:** Switching among all editor page families either renders the
correct preview or shows an actionable error. A draft cannot be mistaken for
already published content.

## 3. Use one clear save/publish area

**Observed:** Save/publish controls appear in a sticky top toolbar and a fixed
bottom bar. Publishing status is repeated again below the editor. At the reviewed
desktop height, the persistent bars take noticeable space away from the form.
Clients also see draft numbers, revision numbers and delivery terminology.

**Change:** Keep one persistent action bar with secondary “Save draft” and primary
“Publish changes.” Show one plain status: “Unsaved changes,” “Draft saved — not
published,” “Publishing,” or “Live on website.” Put revision numbers and delivery
details in an expandable details area. Rename “Retry cache refresh” to
“Retry website update.”

For a later workflow improvement, let an explicit Publish changes action validate,
save and then publish the resulting draft. Stop if saving or version checks fail;
never publish a stale draft or publish automatically after an ordinary save.

**Files:** `src/featured/admin-test/Editor.tsx`, `editor-state.ts`,
`editor.module.css`.

**Done when:** There is one action area, and saving a draft versus changing the
public website is obvious. Existing validation, version-conflict protection and
delivery confirmation remain effective.

## 4. Shorten the navigation and surface frequent tasks

**Observed:** The sidebar exposes roughly 28 destinations. Reviews and Global
settings sit near its bottom, after every service page. Legal pages appear near
the top. “Services” and “HVAC” have overlapping meanings for an editor.

**Change:** Use this initial hierarchy:

- Homepage
- Pages, with expandable Website pages, Service pages and Legal pages groups
- Reviews
- Gallery
- Promotions
- Business details (rename Global settings)

Put a page search above the page groups. Keep common tasks visible without
scrolling. Rename the Services listing page “Services overview” so it is distinct
from individual service pages. Rename “Leave admin” to “View website” and open the
public page in a new tab, preserving the editing workspace.

**Files:** `src/featured/admin-test/AdminShell.tsx`, `shell.module.css`, page label
definitions in `cms/shared/contract.ts` and related registries.

**Done when:** The client can find reviews, photos, promotions and the business
phone immediately. Collapsible groups remain keyboard accessible.

## 5. Connect the selected section to its preview

**Observed in code:** Homepage section selection lives inside `HomeFields`, while
`HomePreviewFrame` only receives the document and screen size. Selecting a section
does not tell the preview which section the client wants to inspect. The desktop
preview is scaled from 1280 pixels into a narrower column.

**Change:** Send the selected section to the preview and scroll to/highlight it.
Provide an expanded preview view for reading at a useful size. Use editor/preview
tabs on smaller screens instead of placing a long preview below a long form.
Keep headings and helper text readable; current helper text is often 11px.

**Files:** `HomeFields.tsx`, `HomePreviewFrame.tsx`, `HomePreview.tsx`,
`Editor.tsx`, `editor.module.css` under `src/featured/admin-test/`.

**Done when:** Choosing Contact introduction reveals that section in the preview
without manual searching. Screen-size controls and expanded preview preserve edits.

## 6. Make photos visual and simplify replacement

**Observed:** Gallery initially shows text-only collapsed photo rows and a generic
“+ Add item.” Opening a row reveals “Choose or upload photo”; opening that reveals
another nested library, a disabled image path, and a separate Replace button.

**Change:** Show each photo thumbnail and caption immediately. Use “Add photo,”
“Replace photo,” “Move up,” and “Move down.” Open one photo picker with Upload and
Library choices. Selecting a replacement should directly replace the chosen
photo in the draft. Hide raw image paths and single-photo ordering controls from
the normal client view. Label visible captions separately from accessibility
descriptions where both exist.

**Files:** `src/featured/admin-test/ContentFields.tsx`, `ImageEditor.tsx`,
`images.module.css`, `editor.module.css`.

**Done when:** The current photo is identifiable before opening the picker and
the client can replace it without navigating a second replacement step. Draft
changes do not delete original media or alter published content before publishing.

## 7. Group long forms by recognizable page sections

**Observed:** Most content pages use generic fields and repeated records. Global
settings combines contact details, address, directions, social accounts and shared
page text in a long form. Search settings shows “Internal page title” alongside
search title and description without explaining where those labels appear.

**Change:** Group fields under names such as Page introduction, Main content,
Service cards and Contact banner. Split Business details into Contact, Location,
Social profiles and Shared website text. Keep search settings collapsed or in a
secondary tab, with a simple search-result preview. Explain internal labels or
remove them from routine editing if the client does not need to change them.
Replace generic “Add item” labels with the actual item name. Show validation next
to the relevant field and focus the first error after a failed save.

**Files:** `ContentFields.tsx`, `CollectionFields.tsx`, `Editor.tsx` under
`src/featured/admin-test/`; field registries under `cms/shared/`.

**Done when:** Clients can connect each group to a visible website section and
can identify which field needs correction without reading a general error dump.

## 8. Clarify reviews and cross-page settings

**Observed:** “Reviews” appears in Homepage section editing and as a separate
sidebar destination. The homepage currently tells clients to find the other
editor in the sidebar. Review controls use “Homepage favorite,” while the website
navigation calls the reviews destination “Client.”

**Change:** Distinguish “Reviews section heading” from “Manage customer reviews.”
Provide a direct navigation button with the existing unsaved-change protection.
Rename “Homepage favorite” to “Feature on homepage (up to 3).” Offer filters for
All, Featured and Hidden, and keep reviewer names visible in collapsed rows.
Explain that this is a manually managed testimonial library; it does not update
the separate Google rating/count shown in the hero. Show a short “Used on…” note
for settings shared across multiple pages.

**Files:** `src/featured/admin-test/HomeFields.tsx`, `CollectionFields.tsx`,
`Editor.tsx`.

**Done when:** The client knows where to edit testimonial text and how to choose
the three homepage reviews, without assuming a Google synchronization exists.

## Suggested delivery order

First ship items 1–3: correct ownership text, reliable preview status and one
publishing area. Then simplify navigation and photo editing. Finally improve
section-aware previews and form grouping. Keep the current restrained visual
style and the simple login page; a dashboard redesign is not required.

For implementation, follow `codex.md` and the local Next.js guidance. Verify
draft versus published state, page-switch recovery, unsaved-change protection,
photo replacement and keyboard navigation. Publishing checks should use an
isolated local/test environment, not client production content.
