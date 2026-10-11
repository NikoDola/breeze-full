-- Next.js owns delivery. A unique lease prevents an expired invocation from
-- acknowledging a newer retry. Existing publications and content are retained.
ALTER TABLE cms_publish_outbox ADD COLUMN lease_token TEXT;
