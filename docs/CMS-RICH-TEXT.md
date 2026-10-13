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
