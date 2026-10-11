"use client";
import { useCallback, useEffect, useState } from "react";
import CmsProofContent from "@/components/sections/CmsProofContent";
import { validateDocument, type Document, type Draft, type EditorState, type Section } from "../../../cms/shared/contract";
import styles from "./editor.module.css";

export default function Editor() {
  const [state, setState] = useState<EditorState | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [baseDraft, setBaseDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const dirty = Boolean(document && baseDraft && JSON.stringify(document) !== JSON.stringify(baseDraft.document));
  const newerDraft = Boolean(baseDraft && state?.draft && baseDraft.version !== state.draft.version);

  const request = useCallback(async (body?: unknown): Promise<EditorState> => {
    const response = await fetch("/api/cms/editor", {
      method: body ? "POST" : "GET", cache: "no-store", credentials: "same-origin",
      headers: { "Content-Type": "application/json", "x-cms-request": "editor" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status}).`);
    return result;
  }, []);
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try { const data = await request(); setState(data); setBaseDraft(data.draft); setDocument(data.draft?.document ?? null); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load content."); }
    finally { setBusy(false); }
  }, [request]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function act(action: "import" | "draft" | "publish" | "retry") {
    setBusy(true); setError(""); setMessage("");
    try {
      if (action === "draft") validateDocument(document);
      const next = await request({ action, document: action === "draft" ? document : undefined, expectedVersion: baseDraft?.version });
      setState(next);
      if (action === "import" || action === "draft") { setBaseDraft(next.draft); setDocument(next.draft?.document ?? null); }
      setMessage(action === "draft" ? "Draft saved. The public page is unchanged." : action === "import" ? "Existing content copied into the test draft." : next.delivery?.confirmed_at ? "Published revision confirmed on the public page." : "Publication saved. Public-page confirmation is pending; retry delivery or refresh status.");
    } catch (e) { setError(e instanceof Error ? e.message : "Request failed."); }
    finally { setBusy(false); }
  }
  const changeSection = (field: keyof Omit<Section, "images">, value: string) => {
    if (document) setDocument({ ...document, section: { ...document.section, [field]: value } });
  };
  const fields: { key: keyof Omit<Section, "images">; label: string; max: number; multiline?: boolean }[] = [
    { key: "eyebrow", label: "Eyebrow", max: 200 }, { key: "headline", label: "Headline", max: 300 },
    { key: "body", label: "Description", max: 10000, multiline: true },
    { key: "button_text", label: "Button text", max: 100 }, { key: "button_route", label: "Button destination", max: 2048 },
    { key: "bottom_note", label: "Bottom note", max: 1000 },
  ];
  return <div className={styles.editor}>
    <header className={styles.header}>
      <div><p className={styles.eyebrow}>Breeze · Test workspace</p><h1>Content editor</h1><p>One section, from draft to published page.</p></div>
      <a href="/cms-proof" target="_blank" rel="noreferrer">Open public test page ↗</a>
    </header>
    <div className={styles.status} aria-live="polite">
      <span>Draft: {baseDraft ? `v${baseDraft.version}${dirty ? " · unsaved changes" : " · saved"}` : "not imported"}</span>
      <span>Published: {state?.publication ? `v${state.publication.version}` : "none"}</span>
      <span>Public page: {state?.delivery?.confirmed_at ? "confirmed" : state?.publication ? "awaiting confirmation" : "not published"}</span>
    </div>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {newerDraft && <p className={styles.error} role="alert">A newer draft is available. Copy any unsaved edits, then refresh before saving or publishing.</p>}
    {message && <p role="status">{message}</p>}
    {state?.delivery?.last_error && <p className={styles.error}>Delivery: {state.delivery.last_error} Attempts: {state.delivery.attempts}.</p>}
    <div className={styles.actions}>
      <button type="button" disabled={busy} onClick={() => { if (!dirty || window.confirm("Discard unsaved edits and reload?")) void load(); }}>Refresh status</button>
      {state && !state.draft && <button type="button" disabled={busy} onClick={() => void act("import")}>Copy existing D1 content</button>}
      {state?.publication && !state.delivery?.confirmed_at && <button type="button" disabled={busy} onClick={() => void act("retry")}>Retry cache refresh</button>}
      {busy && <span role="status">Working…</span>}
    </div>
    {document && <div className={styles.grid}>
      <form onSubmit={event => { event.preventDefault(); void act("draft"); }}>
        <fieldset disabled={busy}>
          <legend>Section content</legend>
          {fields.map(({ key, label, max, multiline }) => <label key={key}>{label}
            {multiline ? <textarea value={document.section[key]} maxLength={max} rows={6} onChange={e => changeSection(key, e.target.value)} />
              : <input value={document.section[key]} maxLength={max} required={key === "headline"} onChange={e => changeSection(key, e.target.value)} />}
          </label>)}
          <details><summary>Page title and search description</summary>
            {(["title", "seoTitle", "seoDescription"] as const).map(key => <label key={key}>{key === "title" ? "Page title" : key === "seoTitle" ? "SEO title" : "SEO description"}
              <input value={document[key]} maxLength={key === "seoDescription" ? 500 : 200} required={key === "title"} onChange={e => setDocument({ ...document, [key]: e.target.value })} />
            </label>)}
          </details>
          <p className={styles.note}>{document.section.images.length} existing image references preserved. Image editing is a later milestone.</p>
          <div className={styles.actions}>
            <button type="submit" disabled={!dirty || newerDraft}>Save draft</button>
            <button type="button" className={styles.publish} disabled={dirty || newerDraft || !baseDraft || state?.publication?.version === baseDraft.version} onClick={() => void act("publish")}>Publish saved draft</button>
          </div>
        </fieldset>
      </form>
      <section className={styles.preview} aria-label="Draft preview"><h2>Draft preview</h2><CmsProofContent document={document} /></section>
    </div>}
  </div>;
}
