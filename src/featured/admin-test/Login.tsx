"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import css from "./login.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [stage, setStage] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [wait, setWait] = useState(0);
  const codeInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const timer = window.setTimeout(() => setWait(value => Math.max(0, value-1)), 1000);
    return () => window.clearTimeout(timer);
  }, [wait]);
  useEffect(() => { if (stage === "code") codeInput.current?.focus(); }, [stage]);

  async function submit(action: "request-code" | "verify-code") {
    if (busy) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/cms/session", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", "x-cms-request": "editor" },
        body: JSON.stringify({ action, email, ...(action === "verify-code" ? { code } : {}) }),
      });
      const result = await response.json();
      if (!response.ok) {
        const seconds = Number(response.headers.get("Retry-After"));
        if (Number.isSafeInteger(seconds) && seconds > 0) setWait(Math.min(seconds, 86400));
        setError(result.error || "We could not sign you in. Please try again.");
        return;
      }
      if (action === "request-code") {
        setStage("code"); setCode(""); setWait(result.resendAfter || 60);
        setNotice(result.message); codeInput.current?.focus();
      } else {
        setCode(""); window.location.replace("/admin-test");
      }
    } catch { setError("We could not connect. Check your connection and try again."); }
    finally { setBusy(false); }
  }
  function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(stage === "email" ? "request-code" : "verify-code");
  }

  return <main className={css.page}>
    <section className={css.formPanel} aria-labelledby="login-title">
      <a href="/" className={css.backLink}><span aria-hidden="true">←</span> Back to website</a>
      <div className={css.card}>
        <h1 id="login-title">Admin sign in</h1>
        <form onSubmit={signIn} aria-busy={busy}>
          <div className={css.field}>
            <label htmlFor="cms-email">Email address</label>
            <input id="cms-email" name="email" type="email" autoComplete="email" autoCapitalize="none" spellCheck={false}
              maxLength={254} required disabled={busy} readOnly={stage === "code"} placeholder="Your email address"
              value={email} onChange={event => setEmail(event.target.value)} />
          </div>
          {stage === "code" && <div className={css.field}>
            <label htmlFor="cms-code">Verification code</label>
            <input ref={codeInput} id="cms-code" name="code" inputMode="numeric" autoComplete="one-time-code"
              pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={busy} placeholder="Six-digit code"
              value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ""))} />
            <p className={css.hint}>Codes expire after 10 minutes. Use this browser to finish signing in.</p>
          </div>}
          <div aria-live="polite" aria-atomic="true">
            {notice && <p className={css.notice} role="status">{notice}</p>}
            {error && <p className={css.error} role="alert">{error}</p>}
          </div>
          <button className={css.submit} type="submit" disabled={busy || (stage === "email" && wait > 0)}>
            {busy ? (stage === "email" ? "Sending code…" : "Please wait…") : stage === "email" ? "Send verification code" : "Verify and sign in"}
          </button>
          {stage === "email" && wait > 0 && <p className={css.hint}>Try again in {wait} seconds.</p>}
          {stage === "code" && <div className={css.codeActions}>
            <button type="button" disabled={busy || wait > 0} onClick={() => void submit("request-code")}>{wait > 0 ? `Resend in ${wait}s` : "Resend code"}</button>
            <button type="button" disabled={busy} onClick={() => { setStage("email"); setCode(""); setError(""); setNotice(""); }}>Change email</button>
          </div>}
        </form>
        <p className={css.support}>Need help signing in? Contact <a href="mailto:nikodola@gmail.com?subject=Admin%20sign-in%20help">nikodola@gmail.com</a></p>
      </div>
    </section>
  </main>;
}
