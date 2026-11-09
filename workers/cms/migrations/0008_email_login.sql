-- Codes and browser bindings are stored as keyed hashes, never plaintext.
CREATE TABLE cms_email_login_challenges (
  id TEXT PRIMARY KEY,
  email_key TEXT NOT NULL,
  binding_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'failed', 'consumed')),
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  verified_by TEXT
);
CREATE INDEX cms_email_login_expiry ON cms_email_login_challenges(expires_at);
CREATE INDEX cms_email_login_binding ON cms_email_login_challenges(email_key, binding_hash, status);
CREATE UNIQUE INDEX cms_email_login_verification ON cms_email_login_challenges(verified_by) WHERE verified_by IS NOT NULL;
CREATE TABLE cms_email_login_send_limits (
  bucket TEXT PRIMARY KEY,
  sends INTEGER NOT NULL DEFAULT 0,
  window_started INTEGER NOT NULL,
  last_sent INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX cms_email_login_send_expiry ON cms_email_login_send_limits(window_started);
