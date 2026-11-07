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
