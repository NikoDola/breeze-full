# Interior hero images

Each interior page has a **Hero image** picker under **Page content**, below its
introductory text. Reviews exposes the same picker in its page hero/headings
section. Choose an existing site photo or upload through the existing media
library, then save or publish. **Restore default hero** restores the original
banner. A wide photo works best; the existing banner crops it to fill its frame.

Promotions has independent banner choices for its listing and both seasonal
pages. The winter/summer choices are under **Seasonal page hero images**. These
choices affect only their heroes, preserving the offer card/body photos. Service
listing cards also retain their original photos. The homepage hero stays fixed.

## Storage and rendering

- Optional `heroImage` references on schema-6 content and schema-4 Reviews store
  approved local paths or validated asset placements. Omitted fields preserve old
  snapshots; `null` restores the default. Promotions optionally stores the two
  seasonal overrides in `offerHeroImages`.
- Draft previews use the authenticated media endpoint. Published rendering derives
  public URLs from the configured Worker origin. Existing hero shading and service
  parallax remain in place. Search/social images are independent.
- Migration `0006_hero_media.sql` validates uploaded hero assets and records their
  revision references in the same transaction as publication. Failed publication
  cannot expose an upload; replaced photos remain available to historical revisions.
  Worker health checks require both triggers, and uploaded hero saves/publications
  fail closed if the migration is missing.

## Rollout and verification

Back up the target database, then apply migration `0006_hero_media.sql`. Deploy
compatible Next readers before the updated Worker accepts hero fields; older
readers reject unfamiliar document fields. Refresh editor tabs after rollout.
No historical documents or homepage artwork need to be rewritten.

Run `npm run build` and `npm run cms:check`. `hero-image.test.mjs` covers old
snapshots, validation, all interior renderers, authenticated/public image URLs,
independent seasonal banners, picker interactions, publication rollback,
retention, and missing-migration protection.

Local verification on 2026-10-19: production build, lint, Worker typecheck and
all four hero tests passed. The full CMS suite passed 77 of 80 tests; its existing
failures expect older editor status labels (two tests) and the replaced native
service form in the homepage snapshot (one test). Those implementations and
fixtures were not changed for this feature. The local database was exported to
ignored `.local/hero-images/before-0006-2026-10-19.sql` before migration 0006 was
applied. Remote databases and deployments still require the rollout above.
