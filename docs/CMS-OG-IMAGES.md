# OG images in Search settings

Content pages and Reviews support an optional OG image in their existing search
settings. Upload through the media library, then select the uploaded image; an
approved existing site photo can also be selected. Replace and Remove affect the
draft until it is published. The editor recommends a 1200 × 630 image and shows
an authenticated preview. The existing file formats and upload limits apply.

The published image is included in Open Graph and Twitter large-image metadata
alongside the page's search title and description. Promotions shares its selected
image with both seasonal offer pages. Pages without a selected image retain their
previous metadata. This does not introduce homepage or business-wide OG settings.

## Storage and publishing

- `cms/shared/seo.ts` validates optional `ogImage` on schema-6 content and schema-4
  Reviews documents. Omitted fields preserve historical snapshots; `null` removes
  an image. Uploaded references store asset IDs, dimensions and descriptions, not
  provider URLs. Existing site photos use the same allowlist as Gallery.
- `OgImageField.tsx` reuses `ImageEditor.tsx`, including upload progress, validation,
  library search and the editor's busy lock.
- `src/lib/cms/metadata.ts` derives published image URLs from the configured Worker.
  Local site paths resolve through the root layout's existing `metadataBase`.
  Sharing metadata never uses the authenticated preview endpoint.
- Migration `0005_og_media.sql` validates ready assets and captures revision
  references in the publication transaction. Failed publishing cannot expose a
  draft image. Replaced/removed images remain available to historical revisions.
- Worker health checks include both OG triggers. Saving/publishing an uploaded OG
  image fails closed if the migration is missing.

## Rollout and verification

Back up the target database and apply migration `0005_og_media.sql`. Deploy the
compatible Next readers before enabling the updated Worker to accept OG fields;
older Next readers reject unknown document fields. Refresh open editor tabs after
the rollout. No historical JSON is rewritten and no new credentials are needed.

The local database was backed up in ignored `.local/` and migrated on 2026-10-18.
Remote migrations and deployments are separate from this local implementation.

Run `npm run build` and `npm run cms:check`. `og-image.test.mjs` covers historical
validation, draft retention, publication rollback, public image delivery, retained
history, missing migration protection, metadata origins and picker interactions.
