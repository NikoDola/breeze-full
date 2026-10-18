-- OG images follow the same atomic publication and retention rules as page images.
-- Existing snapshots and content/proof media triggers remain unchanged.
CREATE TRIGGER og_media_validate_publication BEFORE INSERT ON cms_revisions
WHEN json_extract(NEW.document_json, '$.schemaVersion') IN (4, 6)
  AND json_type(NEW.document_json, '$.ogImage') = 'object'
  AND NOT EXISTS (
    SELECT 1 FROM media_assets a
    WHERE a.id = json_extract(NEW.document_json, '$.ogImage.assetId') AND a.status = 'ready'
      AND a.width = json_extract(NEW.document_json, '$.ogImage.width')
      AND a.height = json_extract(NEW.document_json, '$.ogImage.height')
  )
BEGIN SELECT RAISE(ABORT, 'Publication contains unavailable OG media'); END;
CREATE TRIGGER og_media_capture_publication AFTER INSERT ON cms_revisions
WHEN json_extract(NEW.document_json, '$.schemaVersion') IN (4, 6)
  AND json_type(NEW.document_json, '$.ogImage') = 'object'
BEGIN
  INSERT OR IGNORE INTO revision_assets(revision_id, asset_id)
    VALUES (NEW.id, json_extract(NEW.document_json, '$.ogImage.assetId'));
END;
