# 2 TODO: CMS Version History, Automatic Change Logs & Restore

**Priority:** After R2 media integration  
**Project:** Breeze CMS  
**Branch:** `cms-testing`

## Goal

Implement a Git-style version history system in our existing CMS, allowing clients to review previous changes and safely restore older website content, including images.

### Phase 1 — Astra: Backend

- Automatically compare the current published revision with the new draft.
- Generate readable commit titles and descriptions without requiring AI or manual input.
- Detect changed text, added/removed images, replaced images, reordered items, and modified sections.
- Allow optional editing of the generated commit message before publishing.
- Store both the automatic change details and the editable commit message in D1.
- Record publication timestamps and publisher identity when available.
- Preserve immutable revision history.
- Support previewing historical versions with their original images.
- Implement **Restore as Draft**, never overwriting published content directly.
- When restoring and publishing an older version, create a new revision with an automatically generated restoration message.
- Preserve compatibility with existing CMS documents and historical revisions.
- Test publishing, restoration, image retention, authorization, and cache invalidation.

### Phase 2 — Sol: Admin UI/UX

- Add a **Version History** tab to the CMS.
- Display revisions in a clean, chronological timeline.
- Show automatic commit titles, descriptions, dates, and publishers.
- Allow users to expand a revision to see exactly what changed.
- Provide a visual preview of previous versions.
- Add optional editing of the automatically generated commit message before publishing.
- Add a **Restore as Draft** action with confirmation.
- Clearly distinguish the current published version, drafts, and historical versions.
- Keep the interface simple for nontechnical business owners.

### Phase 3 — Astra: Final Verification

- Verify the UI integrates correctly with the existing publishing backend.
- Test restoring old text and R2 images.
- Confirm no historical revisions are modified or deleted.
- Test draft privacy and publishing permissions.
- Confirm cache invalidation works after restoration.
- Run focused regression tests.

## Important requirements

- Clients must **never be required to write commit messages**.
- Change descriptions are generated automatically from actual content differences.
- Editing commit messages is entirely optional.
- The system must work without paid AI services.
- Restoring an older version creates a new revision rather than deleting newer history.
- Preserve existing Breeze design and CMS functionality.
- Do not modify production resources or merge into `main`.

**Expected result:** A client-friendly version history where every publication tells the story of what changed, and previous website content can be recovered safely with a few clicks.