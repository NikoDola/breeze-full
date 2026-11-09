import { LOGIN_LOCK_SECONDS, MAX_FAILED_LOGIN_ATTEMPTS } from "../../../cms/shared/login-policy";

type Attempt = { failed_attempts: number; locked_until: number };

export async function recordLoginAttempt(db: D1Database, key: string, valid: boolean, now = Math.floor(Date.now() / 1000)) {
  // One atomic upsert makes simultaneous guesses share the same five attempts.
  // A locked source cannot reset its counter, even with the correct password.
  // Further requests never extend the lock. A success before lockout clears it.
  const results = await db.batch<Attempt>([
    db.prepare("DELETE FROM cms_login_attempts WHERE window_started < ? AND locked_until <= ?")
      .bind(now - 86400, now),
    db.prepare(`INSERT INTO cms_login_attempts (source_key, failed_attempts, window_started, locked_until)
      VALUES (?1, CASE WHEN ?2 = 1 THEN 0 ELSE 1 END, ?3, 0)
      ON CONFLICT(source_key) DO UPDATE SET
        failed_attempts = CASE
          WHEN locked_until > ?3 THEN failed_attempts
          WHEN ?2 = 1 THEN 0
          WHEN locked_until > 0 OR window_started <= ?3 - ${LOGIN_LOCK_SECONDS} THEN 1
          ELSE MIN(${MAX_FAILED_LOGIN_ATTEMPTS}, failed_attempts + 1) END,
        window_started = CASE
          WHEN locked_until > ?3 THEN window_started
          WHEN ?2 = 1 OR locked_until > 0 OR window_started <= ?3 - ${LOGIN_LOCK_SECONDS} THEN ?3
          ELSE window_started END,
        locked_until = CASE
          WHEN locked_until > ?3 THEN locked_until
          WHEN ?2 = 1 OR locked_until > 0 OR window_started <= ?3 - ${LOGIN_LOCK_SECONDS} THEN 0
          WHEN failed_attempts >= ${MAX_FAILED_LOGIN_ATTEMPTS - 1} THEN ?3 + ${LOGIN_LOCK_SECONDS}
          ELSE 0 END
      RETURNING failed_attempts, locked_until`).bind(key, valid ? 1 : 0, now),
  ]);
  const attempt = results[1].results[0];
  if (!attempt) throw new Error("Login protection did not return a result.");
  const retryAfter = Math.min(LOGIN_LOCK_SECONDS, Math.max(0, attempt.locked_until - now));
  return { allowed: valid && retryAfter === 0, retryAfter };
}
