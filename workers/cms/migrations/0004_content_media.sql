-- Extend publication protection to validated schema-6 page content. Historical
-- revisions and the schema-3 triggers remain unchanged.
CREATE TRIGGER content_media_validate_publication BEFORE INSERT ON cms_revisions
WHEN json_extract(NEW.document_json, '$.schemaVersion') = 6 AND EXISTS (
  SELECT 1 FROM json_tree(NEW.document_json, '$.content') i
  WHERE i.type = 'object' AND json_extract(i.value, '$.assetId') IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM media_assets a WHERE a.id = json_extract(i.value, '$.assetId')
    AND a.status = 'ready' AND a.width = json_extract(i.value, '$.width') AND a.height = json_extract(i.value, '$.height')
  )
)
BEGIN SELECT RAISE(ABORT, 'Publication contains unavailable content media'); END;
CREATE TRIGGER content_media_capture_publication AFTER INSERT ON cms_revisions
WHEN json_extract(NEW.document_json, '$.schemaVersion') = 6
BEGIN
  INSERT OR IGNORE INTO revision_assets(revision_id, asset_id)
    SELECT NEW.id, json_extract(i.value, '$.assetId') FROM json_tree(NEW.document_json, '$.content') i
    WHERE i.type = 'object' AND json_extract(i.value, '$.assetId') IS NOT NULL;
END;
