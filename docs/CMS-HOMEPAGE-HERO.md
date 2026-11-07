# Homepage hero editing

The homepage editor starts on **Homepage > Hero**. It uses the existing protected
draft, preview and publishing workflow.

Choose a section with the searchable **Select Section** control. Its numbered
options follow the public page order: 1. Hero, 2. Heating & cooling,
3. Contact introduction, 4. Reviews, 5. Service area. Search keeps these original
numbers. Arrow keys and Enter select an option; Escape or leaving the control
cancels the search and keeps the previous selection. Selecting a section changes
the fields and preview focus without changing or saving content.

Editable fields:

- **Heading:** one rich text editor for the entire heading. Select any words and
  apply Default or Breeze Orange; bold and italic use the existing toolbar.
  Enter adds a line break. Punctuation is part of the editable text. Never split
  the heading into separate line, word or accent inputs. The initial text keeps
  its original line breaks and orange wording/full stop. Longer lines can wrap
  on narrow screens to avoid clipping.
- Introduction, with explicit line breaks preserved.
- Google rating (0–5, at most one decimal place) and review count (a whole number
  from 0 to 9999999, entered without commas). These are updated manually from
  Google; there is no automatic Google connection. Visible stars and the link's
  accessible description follow the entered rating and count.
- Service request and call button labels. Destinations remain the service request
  section and the phone number in Global settings. The call label is followed by
  that phone number automatically.

The hero's photographs, responsive preloads, Google mark, wind animation,
experience badge, layout and styling remain controlled by the project. There is
no homepage image picker. Both validation layers reject image, link, phone and
layout overrides in the hero document.

## Stored content

`schemaVersion: 2` remains unchanged. Homepage template version 3 adds the required
`hero` slot (`type: breeze.hero`, section version 2) alongside the four existing
rich-heading sections (section version 2).

Template versions 1 and 2 remain readable and render the original hero defaults.
Earlier template-version-3 documents with split hero fields (hero section version
1) also remain readable. Opening the editor converts that heading into one rich
text value in memory, preserving words, line breaks, accent colors, punctuation
and other saved fields. The first content edit saves hero section version 2 in
template version 3. Opening or undoing to the original content does not mark the
page as changed. Existing drafts and immutable published revisions are never
rewritten by conversion. No SQL migration, backfill or new environment setting
is required. Split field definitions exist only for reading historical content;
the editor always presents the single rich heading control.

The public page, homepage draft preview and Global settings' Hero placement use
the same hero component and homepage content. Drafts remain private until the
normal Publish action. An incomplete or invalid preview keeps the last valid
content. Selecting Hero focuses the hero inside the protected preview frame.

For hosted rollout, release the updated Worker and Next readers before saving
hero-section-version-2 documents. After those saves, use a compatible reader for
rollback. This implementation does not deploy or publish content.

## Verification

`workers/cms/tests/home-hero.test.mjs` covers old-document compatibility, conversion
without false edits, saved split-heading conversion, rich formatting/text escaping,
numeric validation, fixed artwork, a single heading editor, preview messages/focus, draft privacy, version conflicts, immutable
publication and repeat publication. Its artwork/default-copy fixture was captured
from the original committed hero before enabling text editing. The original
homepage fixture continues protecting public CSS and the other section markup.

Browser visual acceptance remains with the owner, as required by `codex.md`.

Initial verification on 7 November 2026: Next.js production build and both TypeScript
checks passed. All six initial hero tests passed. The full CMS suite returned 85
passes and the three pre-existing failures documented in the workspace's
`docs/VERIFICATION.md` (two status-label expectations and the former native-form
fixture). No production deployment or owner-content edits were performed.

The single-heading correction passed all 17 focused hero, rich text editor,
conversion and preview tests, both TypeScript checks and the Next.js production
build on 7 November 2026. The mandatory one-field rule is recorded in root/project
`AGENTS.md`, `codex.md` and `docs/WEBSITE.md` for future CMS work.

The searchable section selector passed its mouse/keyboard/search/cancellation
test and all seven hero regressions (eight focused tests total), plus the Next.js
production build on 7 November 2026. Visual review remains with the owner.
