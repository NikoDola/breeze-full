-- Login protection is separate from content and the general request limiter.
-- Keys are server-generated HMACs, never raw IPs, usernames or passwords.
CREATE TABLE cms_login_attempts (
  source_key TEXT PRIMARY KEY,
  failed_attempts INTEGER NOT NULL CHECK (failed_attempts BETWEEN 0 AND 5),
  window_started INTEGER NOT NULL,
  locked_until INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX cms_login_attempts_expiry ON cms_login_attempts(window_started);
