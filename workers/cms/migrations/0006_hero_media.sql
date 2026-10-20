-- Hero images use the same atomic publication and historical retention as media.
-- The homepage artwork remains outside these schema-4/schema-6 overrides.
CREATE TRIGGER hero_media_validate_publication BEFORE INSERT ON cms_revisions
WHEN json_extract(NEW.document_json, '$.schemaVersion') IN (4, 6) AND EXISTS (
  SELECT 1 FROM json_tree(NEW.document_json) i
  WHERE i.type = 'object' AND (i.fullkey = '$.heroImage' OR i.path = '$.offerHeroImages')
    AND NOT EXISTS (
      SELECT 1 FROM media_assets a WHERE a.id = json_extract(i.value, '$.assetId')
        AND a.status = 'ready' AND a.width = json_extract(i.value, '$.width')
        AND a.height = json_extract(i.value, '$.height')
    )
)
BEGIN SELECT RAISE(ABORT, 'Publication contains unavailable hero media'); END;
CREATE TRIGGER hero_media_capture_publication AFTER INSERT ON cms_revisions
WHEN json_extract(NEW.document_json, '$.schemaVersion') IN (4, 6)
BEGIN
  INSERT OR IGNORE INTO revision_assets(revision_id, asset_id)
    SELECT NEW.id, json_extract(i.value, '$.assetId') FROM json_tree(NEW.document_json) i
    WHERE i.type = 'object' AND (i.fullkey = '$.heroImage' OR i.path = '$.offerHeroImages');
END;
