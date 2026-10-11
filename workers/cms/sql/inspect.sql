-- Read-only preflight. Run against the intended database before migration.
SELECT name, type, sql FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' ORDER BY name;
PRAGMA table_info(page_sections);
