"use client";

import { useState, type FormEvent } from "react";
import css from "./login.module.css";

export default function Login() {
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      const response = await fetch("/api/cms/session", {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "Content-Type": "application/json", "x-cms-request": "editor" },
        body: JSON.stringify({ username: data.get("username"), password: data.get("password") }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "We could not sign you in. Please try again."); return; }
      form.reset();
      window.location.replace("/admin-test");
    } catch { setError("We could not connect. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  return <main className={css.page}>
    <section className={css.formPanel} aria-labelledby="login-title">
      <a href="/" className={css.backLink}><span aria-hidden="true">←</span> Back to website</a>
      <div className={css.card}>
        <h1 id="login-title">Admin sign in</h1>
        <form onSubmit={signIn} aria-busy={busy}>
          <div className={css.field}>
            <label htmlFor="cms-username">Username</label>
            <input id="cms-username" name="username" autoComplete="username" autoCapitalize="none" spellCheck={false} maxLength={256} required disabled={busy} placeholder="Your username" />
          </div>
          <div className={css.field}>
            <label htmlFor="cms-password">Password</label>
            <div className={css.passwordField}>
              <input id="cms-password" name="password" type={visible ? "text" : "password"} autoComplete="current-password" maxLength={2048} required disabled={busy} placeholder="Enter your password" />
              <button type="button" className={css.reveal} aria-label={visible ? "Hide password" : "Show password"} aria-pressed={visible} disabled={busy} onClick={() => setVisible(value => !value)}>{visible ? "Hide" : "Show"}</button>
            </div>
          </div>
          <div aria-live="polite" aria-atomic="true">{error && <p className={css.error} role="alert">{error}</p>}</div>
          <button className={css.submit} type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        </form>
        <p className={css.support}>Need help signing in? <a href="mailto:nikodola@gmail.com">Contact support</a></p>
      </div>
    </section>
  </main>;
}
