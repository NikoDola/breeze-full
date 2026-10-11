-- Additive migration. Never reads, changes, renames, or deletes page_sections.
-- Use a separate test database for this milestone. Inspect schema before applying.
CREATE TABLE cms_pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL CHECK (page_type IN ('page', 'blog', 'service')),
  published_revision_id TEXT REFERENCES cms_revisions(id),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);
CREATE TABLE cms_drafts (
  page_id TEXT PRIMARY KEY REFERENCES cms_pages(id),
  version INTEGER NOT NULL CHECK (version > 0),
  document_json TEXT NOT NULL CHECK (json_valid(document_json)),
  updated_at TEXT NOT NULL
);
CREATE TABLE cms_revisions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES cms_pages(id),
  draft_version INTEGER NOT NULL CHECK (draft_version > 0),
  document_json TEXT NOT NULL CHECK (json_valid(document_json)),
  published_at TEXT NOT NULL,
  UNIQUE (page_id, draft_version)
);
CREATE TRIGGER cms_revisions_no_update BEFORE UPDATE ON cms_revisions
BEGIN SELECT RAISE(ABORT, 'Published revisions are immutable'); END;
CREATE TRIGGER cms_revisions_no_delete BEFORE DELETE ON cms_revisions
BEGIN SELECT RAISE(ABORT, 'Published revisions are immutable'); END;
CREATE TRIGGER cms_publication_same_page BEFORE UPDATE OF published_revision_id ON cms_pages
WHEN NEW.published_revision_id IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM cms_revisions WHERE id = NEW.published_revision_id AND page_id = NEW.id
)
BEGIN SELECT RAISE(ABORT, 'Revision belongs to a different page'); END;
CREATE TABLE cms_imports (
  page_id TEXT PRIMARY KEY REFERENCES cms_pages(id),
  source_id TEXT NOT NULL,
  source_json TEXT NOT NULL CHECK (json_valid(source_json)),
  imported_at TEXT NOT NULL
);
CREATE TABLE cms_publish_outbox (
  id TEXT PRIMARY KEY,
  revision_id TEXT NOT NULL UNIQUE REFERENCES cms_revisions(id),
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at INTEGER NOT NULL DEFAULT 0,
  lease_until INTEGER NOT NULL DEFAULT 0,
  invalidated_at TEXT,
  confirmed_at TEXT,
  last_error TEXT
);
CREATE INDEX cms_outbox_pending ON cms_publish_outbox(next_attempt_at) WHERE confirmed_at IS NULL;
