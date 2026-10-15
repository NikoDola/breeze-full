# Homepage rich text

## Contract and compatibility

The homepage retains `schemaVersion: 2`. Template version 1 and its section
versions remain supported. Template version 2 uses section version 2 and one
structured `heading` per section. Proof/media schema versions 1 and 3 are unchanged.

`cms/shared/rich-text.ts` defines a flat editor-independent document: version 1,
text runs and explicit breaks. Optional marks are `bold: true`, `italic: true`,
and `color: "accent"`. Default color inherits from the section. No HTML, CSS,
links, images, blocks, arbitrary attributes or nesting are accepted. Limits are
600 UTF-16 code units, 256 input nodes and 8 explicit breaks per heading. The
existing 48 KiB request limit still applies. Adjacent identical runs normalize
deterministically. Next's draft API and the Worker share validation; the Worker
also validates before publishing. Public rendering validates fetched documents.

`editableHome` converts old heading pieces in memory. It reproduces existing
spacing, `<br>` and orange accent markup without modifying stored documents.
Old revisions remain immutable. No SQL migration or data backfill is needed.
The static renderer imports no Tiptap code and emits only React text and fixed
inline elements. Italic styling is independent of Breeze's legacy orange `<em>`.

## Release order

1. Build/test and deploy the compatibility release to the Worker and Next.js.
   It reads both formats, but retains the old editor. A version-2 heading is
   read-only in this fallback editor; other fields remain editable.
2. Record that compatible deployment as the rollback target.
3. Deploy the Tiptap editor only after both readers are compatible.

Never roll back to a build that understands only template version 1 after saving
version-2 documents. Roll back to the compatibility release instead. To restore
older content, save it as a new draft and publish normally; never mutate revision
rows or bypass delivery. The CMS does not yet have a revision-history restore UI.

## Editor

Tiptap 3.32.0 packages are pinned together and use the MIT license. Only document,
paragraph, text, bold, italic, hard-break, history and our semantic accent mark
are enabled. There is no StarterKit, cloud service, paid extension or UI framework.
Tiptap's React package installs optional menu packages, but our editor does not
import their menus. jsdom 26.1.0 is development-only, compatible with Node 22.16,
and used for DOM interaction tests without opening a browser.

`HomeFields` converts old headings for display only. The first actual edit saves
the new format with the normal optimistic draft version. `sameEditorDocument`
compares the editable representation so merely opening a page or undoing back to
the original content does not create an unsaved-change warning. Draft and publish
remain explicit. There is no autosave or automatic publication.

`RichTextEditor` is dynamically loaded only in the admin. Its toolbar supports
bold, italic, Default, Orange, Clear, Undo and Redo. Enter/Shift+Enter insert a
line break. Paste uses the restricted ProseMirror schema, flattens paragraphs,
strips unsupported formatting and refuses file drops. Transactions exceeding
the heading limits are rejected while retaining the last valid text. An empty
heading is allowed during typing but cannot be saved.

Controlled parent echoes do not reset the document, selection or undo history.
Undo belongs to the active heading session; switching sections, discarding or
loading a draft starts a fresh session. The editor is explicitly non-editable
while saving/publishing; a disabled fieldset alone is insufficient. Content
updates immediately; only preview messages are debounced by 120 ms. Saving checks
the UTF-8 payload size and reads current content, not a delayed preview snapshot.

## Verification and release evidence

- Compatibility commit: `ae7e0f7`.
- Compatible Preview: `https://breeze-full-4z05cqvve-nikodolas-projects.vercel.app`.
- Test Worker version: `0dc9650c-1340-4b68-8bbf-4ce3cef29d61`.
- `npm run cms:check`: 42 checks passed, including actual toolbar DOM interaction,
  malicious paste, limits, deterministic conversion, optimistic conflicts,
  immutable history, authentication and idempotent publication retry.
- `npm run cms:proof`: passed against a disposable local D1/R2 and real Next
  production server. Rich drafts remained private, published formatted HTML was
  escaped correctly, Next rejected invalid formatting before calling the Worker,
  cached homepage requests made zero Worker reads, and old content was restored
  through a new publication without rebuilding.
- All four converted seed sections render byte-identical HTML to the existing
  baseline. Hero/form and original public styles still pass protected-file hashes.
- Built homepage script inspection found no Tiptap/ProseMirror/editor code in its
  nine referenced scripts. Public rendering and cache delivery are unchanged.
- npm reported zero known vulnerabilities after installation; installed Tiptap
  packages were checked for matching versions and MIT licenses.

Only `cms-testing` and the test Worker were updated. An automatic approval review
rejected the attempted push of the compatibility commit to `main` because this
task needs explicit Production release approval. No Production deployment,
Worker, database or content was changed. Before a client release, obtain that
approval and deploy the compatible reader release to the live Worker and Next
first, retaining its deployment as the rollback target. Then deploy the toolbar.
No automated browser visual inspection or remote content mutation was performed
for this feature; public markup equivalence and DOM behavior were tested locally.
