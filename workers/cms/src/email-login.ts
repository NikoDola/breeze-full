import { InputError, record } from "../../../cms/shared/contract";
import { LOGIN_CODE_SECONDS, LOGIN_LOCK_SECONDS, LOGIN_RESEND_SECONDS, LOGIN_SENDS_PER_DAY,
  LOGIN_SENDS_PER_HOUR, MAX_FAILED_LOGIN_ATTEMPTS } from "../../../cms/shared/login-policy";

type Challenge = { id: string; sourceKey: string; emailKey: string; bindingHash: string; codeHash: string };
type Limit = { bucket: string; sends: number; window_started: number; last_sent: number };
type Attempt = { failed_attempts: number; locked_until: number };
const hash = /^[a-f0-9]{64}$/;
const idPattern = /^[a-f0-9]{32}$/;

function challenge(input: Record<string, unknown>): Challenge {
  if (Object.keys(input).length !== 5 || typeof input.id !== "string" || !idPattern.test(input.id) ||
      ![input.sourceKey, input.emailKey, input.bindingHash, input.codeHash].every(value => typeof value === "string" && hash.test(value))) {
    throw new InputError("Invalid email sign-in request.");
  }
  return input as unknown as Challenge;
}

function keys(environment: string, value: Challenge) {
  return { source: `${environment}:${value.sourceKey}`, email: `${environment}:email:${value.emailKey}`,
    challengeId: `${environment}:${value.id}` };
}

export async function startEmailLogin(db: D1Database, environment: string, input: Record<string, unknown>, now = Math.floor(Date.now()/1000)) {
  const value = challenge(input), key = keys(environment, value);
  const buckets = [
    { key: `${key.source}:send`, period: LOGIN_LOCK_SECONDS, maximum: LOGIN_SENDS_PER_HOUR, cooldown: LOGIN_RESEND_SECONDS },
    { key: `${key.email}:send`, period: LOGIN_LOCK_SECONDS, maximum: LOGIN_SENDS_PER_HOUR, cooldown: LOGIN_RESEND_SECONDS },
    { key: `${environment}:email:daily`, period: 86400, maximum: LOGIN_SENDS_PER_DAY, cooldown: 0 },
  ];
  const statements = [
    db.prepare("DELETE FROM cms_email_login_challenges WHERE expires_at < ?").bind(now-86400),
    db.prepare("DELETE FROM cms_email_login_send_limits WHERE window_started < ?").bind(now-172800),
    ...buckets.map(bucket => db.prepare(`INSERT INTO cms_email_login_send_limits(bucket, sends, window_started, last_sent)
      VALUES (?1, 0, ?2, 0) ON CONFLICT(bucket) DO UPDATE SET
        sends = CASE WHEN window_started <= ?3 THEN 0 ELSE sends END,
        window_started = CASE WHEN window_started <= ?3 THEN ?2 ELSE window_started END`)
      .bind(bucket.key, bucket.period === 86400 ? Math.floor(now/86400)*86400 : now,
        bucket.period === 86400 ? Math.floor(now/86400)*86400-1 : now-bucket.period)),
    db.prepare(`INSERT INTO cms_email_login_challenges(id, email_key, binding_hash, code_hash, status, created_at, expires_at)
      SELECT ?1, ?2, ?3, ?4, 'pending', ?5, ?6
      WHERE NOT EXISTS (SELECT 1 FROM cms_login_attempts WHERE source_key IN (?7, ?8) AND locked_until > ?5)
      AND NOT EXISTS (SELECT 1 FROM cms_email_login_send_limits WHERE bucket IN (?9, ?10)
        AND (sends >= ${LOGIN_SENDS_PER_HOUR} OR last_sent > ?5 - ${LOGIN_RESEND_SECONDS}))
      AND NOT EXISTS (SELECT 1 FROM cms_email_login_send_limits WHERE bucket = ?11 AND sends >= ${LOGIN_SENDS_PER_DAY})
      RETURNING id`).bind(key.challengeId, value.emailKey, value.bindingHash, value.codeHash, now, now+LOGIN_CODE_SECONDS,
        key.source, key.email, ...buckets.map(bucket => bucket.key)),
    ...buckets.map(bucket => db.prepare(`UPDATE cms_email_login_send_limits SET sends = sends + 1, last_sent = ?
      WHERE bucket = ? AND EXISTS (SELECT 1 FROM cms_email_login_challenges WHERE id = ? AND status = 'pending')`)
      .bind(now, bucket.key, key.challengeId)),
    db.prepare("SELECT MAX(locked_until) AS locked_until FROM cms_login_attempts WHERE source_key IN (?, ?)").bind(key.source, key.email),
    db.prepare("SELECT * FROM cms_email_login_send_limits WHERE bucket IN (?, ?, ?)").bind(...buckets.map(bucket => bucket.key)),
  ];
  const results = await db.batch(statements);
  const accepted = results[5].results.length === 1;
  if (accepted) return { accepted: true, retryAfter: 0 };
  const locked = results[9].results[0] as { locked_until: number | null } | undefined;
  let retryAfter = Math.max(0, Number(locked?.locked_until ?? 0)-now);
  for (const limit of results[10].results as Limit[]) {
    const bucket = buckets.find(item => item.key === limit.bucket)!;
    if (limit.sends >= bucket.maximum) retryAfter = Math.max(retryAfter, limit.window_started+bucket.period-now);
    retryAfter = Math.max(retryAfter, limit.last_sent+bucket.cooldown-now);
  }
  return { accepted: false, retryAfter: Math.max(1, retryAfter) };
}

export async function completeEmailLogin(db: D1Database, environment: string, input: Record<string, unknown>) {
  if (Object.keys(input).length !== 2 || typeof input.id !== "string" || !idPattern.test(input.id) ||
      !["sent", "failed"].includes(String(input.status))) throw new InputError("Invalid email delivery result.");
  const id = `${environment}:${input.id}`, status = String(input.status);
  const results = await db.batch([
    db.prepare(`UPDATE cms_email_login_challenges SET status = ? WHERE id = ?
      AND (status = 'pending' OR (status = 'sent' AND ? = 'failed')) RETURNING id`).bind(status, id, status),
    // A newly delivered code replaces earlier codes in the same browser/inbox.
    db.prepare(`UPDATE cms_email_login_challenges SET status = 'failed' WHERE id != ?1 AND status IN ('pending', 'sent')
      AND EXISTS (SELECT 1 FROM cms_email_login_challenges current WHERE current.id = ?1 AND current.status = 'sent'
        AND current.email_key = cms_email_login_challenges.email_key AND current.binding_hash = cms_email_login_challenges.binding_hash)`)
      .bind(id),
  ]);
  return { updated: results[0].results.length === 1 };
}

function accountAttempt(db: D1Database, key: string, nonce: string, now: number) {
  const valid = "EXISTS (SELECT 1 FROM cms_email_login_challenges WHERE verified_by = ?2)";
  return db.prepare(`INSERT INTO cms_login_attempts(source_key, failed_attempts, window_started, locked_until)
    VALUES (?1, CASE WHEN ${valid} THEN 0 ELSE 1 END, ?3, 0)
    ON CONFLICT(source_key) DO UPDATE SET
      failed_attempts = CASE WHEN locked_until > ?3 THEN failed_attempts WHEN ${valid} THEN 0
        WHEN locked_until > 0 OR window_started <= ?3 - ${LOGIN_LOCK_SECONDS} THEN 1
        ELSE MIN(${MAX_FAILED_LOGIN_ATTEMPTS}, failed_attempts + 1) END,
      window_started = CASE WHEN locked_until > ?3 THEN window_started
        WHEN ${valid} OR locked_until > 0 OR window_started <= ?3 - ${LOGIN_LOCK_SECONDS} THEN ?3 ELSE window_started END,
      locked_until = CASE WHEN locked_until > ?3 THEN locked_until
        WHEN ${valid} OR locked_until > 0 OR window_started <= ?3 - ${LOGIN_LOCK_SECONDS} THEN 0
        WHEN failed_attempts >= ${MAX_FAILED_LOGIN_ATTEMPTS-1} THEN ?3 + ${LOGIN_LOCK_SECONDS} ELSE 0 END
    RETURNING failed_attempts, locked_until`).bind(key, nonce, now);
}

export async function verifyEmailLogin(db: D1Database, environment: string, input: Record<string, unknown>, now = Math.floor(Date.now()/1000)) {
  const value = challenge(input), key = keys(environment, value), nonce = crypto.randomUUID();
  const results = await db.batch([
    db.prepare("DELETE FROM cms_login_attempts WHERE window_started < ? AND locked_until <= ?").bind(now-86400, now),
    db.prepare(`UPDATE cms_email_login_challenges SET status = 'consumed', verified_by = ?1
      WHERE id = ?2 AND email_key = ?3 AND binding_hash = ?4 AND code_hash = ?5 AND status = 'sent' AND expires_at > ?6
      AND NOT EXISTS (SELECT 1 FROM cms_login_attempts WHERE source_key IN (?7, ?8) AND locked_until > ?6)
      RETURNING id`).bind(nonce, key.challengeId, value.emailKey, value.bindingHash, value.codeHash, now, key.source, key.email),
    accountAttempt(db, key.source, nonce, now),
    accountAttempt(db, key.email, nonce, now),
  ]);
  const retryAfter = Math.min(LOGIN_LOCK_SECONDS, Math.max(0, ...[results[2], results[3]].map(result => (result.results[0] as Attempt).locked_until-now)));
  return { allowed: results[1].results.length === 1, retryAfter };
}

export async function emailLoginAction(db: D1Database, environment: string, action: string, body: unknown) {
  const input = record(body);
  if (action === "request") return startEmailLogin(db, environment, input);
  if (action === "complete") return completeEmailLogin(db, environment, input);
  if (action === "verify") return verifyEmailLogin(db, environment, input);
  throw new InputError("Unknown email sign-in action.");
}
