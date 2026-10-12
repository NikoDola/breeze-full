-- Additive media storage. Existing drafts, imports and immutable revisions are untouched.
CREATE TABLE media_assets (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  original_key TEXT NOT NULL UNIQUE,
  original_bytes INTEGER NOT NULL CHECK (original_bytes > 0 AND original_bytes <= 10485760),
  original_sha256 TEXT,
  master_key TEXT UNIQUE,
  thumbnail_key TEXT UNIQUE,
  width INTEGER,
  height INTEGER,
  default_alt TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('pending','uploading','uploaded','validating','ready','failed')),
  archived INTEGER NOT NULL DEFAULT 0 CHECK (archived IN (0,1)),
  error TEXT,
  validation_token TEXT,
  validation_until INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX media_library ON media_assets(archived, created_at DESC, id DESC);
CREATE TABLE media_upload_sessions (
  asset_id TEXT PRIMARY KEY REFERENCES media_assets(id),
  token_hash TEXT NOT NULL UNIQUE,
  origin TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  created_at INTEGER NOT NULL
);
CREATE INDEX media_upload_rate ON media_upload_sessions(created_at);
CREATE TABLE revision_assets (
  revision_id TEXT NOT NULL REFERENCES cms_revisions(id),
  asset_id TEXT NOT NULL REFERENCES media_assets(id),
  PRIMARY KEY (revision_id, asset_id)
);
CREATE INDEX media_revision_references ON revision_assets(asset_id);
CREATE TRIGGER media_ready_bytes_immutable BEFORE UPDATE ON media_assets
WHEN OLD.status = 'ready' AND (
  NEW.status != OLD.status OR NEW.original_key != OLD.original_key OR
  NEW.original_sha256 IS NOT OLD.original_sha256 OR NEW.original_bytes != OLD.original_bytes OR
  NEW.master_key IS NOT OLD.master_key OR NEW.thumbnail_key IS NOT OLD.thumbnail_key OR
  NEW.width IS NOT OLD.width OR NEW.height IS NOT OLD.height OR NEW.mime_type != OLD.mime_type
)
BEGIN SELECT RAISE(ABORT, 'Ready media bytes are immutable'); END;
CREATE TRIGGER media_revisions_no_update BEFORE UPDATE ON revision_assets
BEGIN SELECT RAISE(ABORT, 'Published media references are immutable'); END;
CREATE TRIGGER media_revisions_no_delete BEFORE DELETE ON revision_assets
BEGIN SELECT RAISE(ABORT, 'Published media references are immutable'); END;
CREATE TRIGGER media_validate_publication BEFORE INSERT ON cms_revisions
WHEN json_extract(NEW.document_json, '$.schemaVersion') = 3 AND EXISTS (
    SELECT 1 FROM json_each(NEW.document_json, '$.section.images') i
    WHERE i.type = 'object' AND NOT EXISTS (
      SELECT 1 FROM media_assets a WHERE a.id = json_extract(i.value, '$.assetId')
      AND a.status = 'ready' AND a.width = json_extract(i.value, '$.width') AND a.height = json_extract(i.value, '$.height')
    )
  )
BEGIN SELECT RAISE(ABORT, 'Publication contains unavailable media'); END;
CREATE TRIGGER media_capture_publication AFTER INSERT ON cms_revisions
WHEN json_extract(NEW.document_json, '$.schemaVersion') = 3
BEGIN
  INSERT OR IGNORE INTO revision_assets(revision_id, asset_id)
    SELECT NEW.id, json_extract(i.value, '$.assetId') FROM json_each(NEW.document_json, '$.section.images') i WHERE i.type = 'object';
END;
