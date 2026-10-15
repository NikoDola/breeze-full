"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import CmsProofContent from "@/components/sections/CmsProofContent";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { pages, validatePageDocument, type PageId, type Document, type Draft, type EditorState, type Section } from "../../../cms/shared/contract";
import { MAX_BODY_BYTES } from "../../../cms/shared/contract";
import { sameEditorDocument } from "../../../cms/shared/editor-document";
import ImageEditor from "./ImageEditor";
import HomeFields from "./HomeFields";
import ContentFields from "./ContentFields";
import { ReviewsFields, GlobalFields } from "./CollectionFields";
import HomePreviewFrame from "./HomePreviewFrame";
import { editorStatus, type Operation } from "./editor-state";
import AdminShell from "./AdminShell";
import styles from "./editor.module.css";

type Tab = "content" | "images" | "details";
type Viewport = "desktop" | "tablet" | "mobile";
const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "content", label: "Content", icon: "grid" },
  { id: "images", label: "Images", icon: "image" },
  { id: "details", label: "Page details", icon: "link" },
];
const fields: { key: keyof Omit<Section, "images">; label: string; help: string; max: number; placeholder: string; multiline?: boolean }[] = [
  { key: "eyebrow", label: "Eyebrow", help: "A short introduction above the headline.", max: 200, placeholder: "Welcome to Breeze" },
  { key: "headline", label: "Headline", help: "The main message visitors see first.", max: 300, placeholder: "Your comfort is our priority" },
  { key: "body", label: "Description", help: "Tell visitors what you offer. Line breaks are preserved.", max: 10000, placeholder: "Professional heating and cooling services for your home.", multiline: true },
];
const errorText = (error: unknown) => error instanceof Error ? error.message : "Something went wrong. Please try again.";
const dateText = (value?: string | null) => value ? new Date(value).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "";

export default function Editor({ proofEnabled = false }: { proofEnabled?: boolean }) {
  const [pageId, setPageId] = useState<PageId>("home");
  return <DocumentEditor key={pageId} pageId={pageId} onPageChange={setPageId} proofEnabled={proofEnabled} />;
}

function DocumentEditor({ pageId, onPageChange, proofEnabled }: { pageId: PageId; onPageChange: (pageId: PageId) => void; proofEnabled: boolean }) {
  const [state, setState] = useState<EditorState | null>(null);
  const [document, setDocument] = useState<Document | null>(null);
  const [baseDraft, setBaseDraft] = useState<Draft | null>(null);
  const [operation, setOperation] = useState<Operation>("load");
  const [tab, setTab] = useState<Tab>("content");
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [previewMode, setPreviewMode] = useState<"draft" | "published">("draft");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [clock, setClock] = useState(0);
  const requestInFlight = useRef(false);
  const [editorReset, setEditorReset] = useState(0);
  const dirty = Boolean(document && baseDraft && !sameEditorDocument(document, baseDraft.document));
  const newerDraft = Boolean(baseDraft && state?.draft && baseDraft.version !== state.draft.version);
  const [mediaBusy, setMediaBusy] = useState(false);
  const busy = operation !== null || mediaBusy;
  const status = editorStatus({ state, baseVersion: baseDraft?.version, dirty, operation, now: clock });
  const publishedIsCurrent = Boolean(baseDraft && state?.publication?.version === baseDraft.version);
  const saveDisabled = busy || !dirty || newerDraft || !document;
  const publishDisabled = busy || dirty || newerDraft || !baseDraft || publishedIsCurrent;
  const saveHelp = dirty ? "Save draft to keep your changes, then Publish draft to update the website."
    : !publishedIsCurrent ? "Your draft is saved. Publish draft to update the website." : status.detail;
  const previewDocument = previewMode === "published" ? state?.publication?.document : document;
  let previewValid = true;
  if (previewDocument) { try { validatePageDocument(pageId, previewDocument); } catch { previewValid = false; } }

  const request = useCallback(async (body?: Record<string, unknown>): Promise<EditorState> => {
    const payload = body ? JSON.stringify({ ...body, pageId }) : undefined;
    if (payload && new TextEncoder().encode(payload).length > MAX_BODY_BYTES) throw new Error("This page exceeds the 48 KiB content limit. Shorten the content before saving.");
    const response = await fetch(`/api/cms/editor?pageId=${pageId}`, {
      method: body ? "POST" : "GET", cache: "no-store", credentials: "same-origin",
      headers: { "Content-Type": "application/json", "x-cms-request": "editor" },
      body: payload,
    });
    let result;
    try { result = await response.json(); }
    catch { throw new Error("The editor could not read the response. Refresh status to check whether your changes were saved."); }
    if (!response.ok) throw new Error(result.error || `Request failed (${response.status}). Refresh status before trying again.`);
    return result;
  }, [pageId]);
  const load = useCallback(async () => {
    if (requestInFlight.current) return;
    requestInFlight.current = true; setOperation("load"); setError("");
    try { const data = await request(); setState(data); setBaseDraft(data.draft); setDocument(data.draft?.document ?? null); setEditorReset(value => value + 1); }
    catch (error) { setError(errorText(error)); }
    finally { requestInFlight.current = false; setOperation(null); }
  }, [request]);
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    setClock(Date.now());
    if (!state?.delivery || state.delivery.confirmed_at) return;
    const timer = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [state?.delivery]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  async function refresh() {
    if (requestInFlight.current) return;
    requestInFlight.current = true; setOperation("refresh"); setError(""); setMessage("");
    try {
      const next = await request(); setState(next);
      // Refresh publishing status without discarding local edits.
      if (!dirty) { setBaseDraft(next.draft); setDocument(next.draft?.document ?? null); setEditorReset(value => value + 1); }
      setMessage(dirty ? "Status refreshed. Your unsaved changes are still here." : "Content and publishing status are up to date.");
    } catch (error) { setError(errorText(error)); }
    finally { requestInFlight.current = false; setOperation(null); }
  }
  async function act(action: "import" | "draft" | "publish" | "retry") {
    if (requestInFlight.current) return;
    if (action === "publish" && (dirty || newerDraft || !baseDraft || publishedIsCurrent)) return;
    if (action === "draft" && (!dirty || newerDraft)) return;
    if (action === "retry" && status.leaseActive) return;
    if (action === "draft") {
      try { validatePageDocument(pageId, document); }
      catch (error) { setError(errorText(error)); return; }
    }
    requestInFlight.current = true; setOperation(action); setError(""); setMessage("");
    try {
      const next = await request({ action, document: action === "draft" ? document : undefined, expectedVersion: baseDraft?.version });
      setState(next);
      if (action === "import" || action === "draft") { setBaseDraft(next.draft); setDocument(next.draft?.document ?? null); }
      setMessage(action === "draft" ? "Draft saved. Publish it when you are ready." : action === "import" ? "Your existing content is ready to edit."
        : next.delivery?.confirmed_at ? "Published content is visible on the website." : "Your publication is saved. Its website refresh still needs confirmation.");
    } catch (error) { setError(errorText(error)); }
    finally { requestInFlight.current = false; setOperation(null); }
  }
  function discardChanges() {
    if (busy || !window.confirm(newerDraft ? "Replace your unsaved changes with the latest saved draft?" : "Discard your unsaved changes?")) return;
    const draft = newerDraft ? state?.draft : baseDraft;
    setBaseDraft(draft ?? null); setDocument(draft?.document ?? null); setError(""); setMessage("Saved draft restored.");
    setEditorReset(value => value + 1);
  }
  const changeSection = (field: keyof Omit<Section, "images">, value: string) => {
    setDocument(current => current && (current.schemaVersion === 1 || current.schemaVersion === 3) ? { ...current, section: { ...current.section, [field]: value } } : current); setMessage("");
  };
  function changeDetails(field: "title" | "seoTitle" | "seoDescription", value: string) {
    setDocument(current => current && (current.schemaVersion === 1 || current.schemaVersion === 3) ? { ...current, [field]: value } : current); setMessage("");
  }

  return <AdminShell pageId={pageId} proofEnabled={proofEnabled} disabled={busy} onPageChange={next => {
    if (busy || (dirty && !window.confirm("Discard your unsaved changes and switch pages?"))) return false;
    onPageChange(next); return true;
  }} onLeave={() => !dirty || window.confirm("Leave admin and discard your unsaved changes?")}>
    <div className={`${styles.workspace} ${document ? styles.withSaveBar : ""}`}><div className={styles.editor}>
    <header className={styles.header}><h1>{pages[pageId].label}</h1><p>Edit content, preview changes, and publish.</p></header>
    <div className={styles.toolbar}>
      <div className={styles.currentStatus} aria-live="polite"><span className={`${styles.statusDot} ${styles[status.tone]}`} /><div><strong>{status.label}</strong><span>{status.detail}</span></div></div>
      <div className={styles.actions}>
        <Button className={styles.secondaryButton} disabled={busy} onClick={() => void refresh()}><Icon name="clock" />{operation === "refresh" ? "Refreshing…" : "Refresh status"}</Button>
        <Button type="submit" form="cms-editor-form" className={styles.secondaryButton} disabled={saveDisabled}>{operation === "draft" ? "Saving draft…" : "Save draft"}</Button>
        <Button className={styles.primaryButton} disabled={publishDisabled} onClick={() => void act("publish")}><Icon name="check" />{operation === "publish" ? "Publishing…" : "Publish draft"}</Button>
      </div>
    </div>
    {error && <div className={`${styles.notice} ${styles.errorNotice}`} role="alert"><strong>We could not complete that action</strong><p>{error}</p><p>Refresh status before trying again. Your local edits will be kept.</p></div>}
    {message && <p className={`${styles.notice} ${styles.successNotice}`} role="status"><Icon name="check" />{message}</p>}
    {newerDraft && <div className={`${styles.notice} ${styles.warningNotice}`} role="alert"><strong>A newer saved draft is available.</strong><p>Your edits are preserved. Copy any changes you want to keep, then load the latest draft.</p><Button className={styles.secondaryButton} disabled={busy} onClick={discardChanges}>Load latest draft</Button></div>}
    {!document ? <section className={styles.emptyState} aria-busy={busy}>
      <span className={styles.emptyIcon}><Icon name="grid" /></span><h2>{operation === "load" ? "Loading content…" : state ? "Content not initialized" : "Content could not load"}</h2>
      <p>{state ? pageId === "home" ? "Copy the approved homepage content into a draft. The original design and hero stay in place." : "Copy the existing website content into a draft. This does not publish or overwrite content." : "Load the saved content to start editing."}</p>
      {state && !state.draft ? <Button className={styles.primaryButton} disabled={busy} onClick={() => void act("import")}>{operation === "import" ? "Preparing content…" : "Copy existing content"}</Button> : !busy && <Button className={styles.secondaryButton} onClick={() => void load()}>Try again</Button>}
    </section> : <>
      <div className={styles.grid}>
        <section className={styles.editPanel} aria-label="Section editor">
          <div className={styles.panelHeading}><h2>Content</h2><span className={styles.smallBadge}>Draft {baseDraft?.version}</span></div>
          {(document.schemaVersion === 1 || document.schemaVersion === 3) && <div className={styles.tabs} role="tablist" aria-label="Editing options">{tabs.map(item => <button key={item.id} id={`tab-${item.id}`} type="button" role="tab" aria-selected={tab === item.id} aria-controls={`panel-${item.id}`} tabIndex={tab === item.id ? 0 : -1} className={tab === item.id ? styles.selectedTab : ""}
            onClick={() => setTab(item.id)} onKeyDown={event => {
              const index = tabs.findIndex(candidate => candidate.id === item.id);
              const next = event.key === "ArrowRight" ? (index + 1) % tabs.length : event.key === "ArrowLeft" ? (index + tabs.length - 1) % tabs.length : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : -1;
              if (next >= 0) { event.preventDefault(); setTab(tabs[next].id); window.document.getElementById(`tab-${tabs[next].id}`)?.focus(); }
            }}><Icon name={item.icon} />{item.label}{item.id === "images" && <span>{document.section.images.length}</span>}</button>)}</div>}
          <form id="cms-editor-form" onSubmit={event => { event.preventDefault(); void act("draft"); }}>
            <fieldset disabled={busy} className={styles.fields}><legend className={styles.srOnly}>Section content</legend>
              {document.schemaVersion === 6 ? <ContentFields document={document} disabled={busy} onBusyChange={setMediaBusy} onChange={next => { setDocument(next); setMessage(""); }} /> : document.schemaVersion === 2 ? <HomeFields document={document} disabled={busy} resetKey={editorReset} onChange={next => { setDocument(next); setMessage(""); }} /> : document.schemaVersion === 4 ? <ReviewsFields document={document} onChange={next => { setDocument(next); setMessage(""); }} /> : document.schemaVersion === 5 ? <GlobalFields document={document} onChange={next => { setDocument(next); setMessage(""); }} /> : <>
              <div id="panel-content" role="tabpanel" aria-labelledby="tab-content" hidden={tab !== "content"}>
                {fields.map(({ key, label, help, max, placeholder, multiline }) => <label className={styles.field} key={key}><span>{label}{key === "headline" && <span className={styles.required}> *</span>}</span><small id={`help-${key}`}>{help}</small>
                  {multiline ? <Textarea value={document.section[key]} maxLength={max} rows={6} placeholder={placeholder} aria-describedby={`help-${key}`} onChange={event => changeSection(key, event.target.value)} />
                    : <Input value={document.section[key]} maxLength={max} placeholder={placeholder} aria-describedby={`help-${key}`} onChange={event => changeSection(key, event.target.value)} />}
                </label>)}
                <div className={styles.fieldGroup}><div className={styles.groupHeading}><Icon name="link" /><h3>Call to action</h3><span>Optional</span></div><p>Add both a label and a destination to show a button.</p>
                  <label className={styles.field}><span>Button text</span><Input value={document.section.button_text} maxLength={100} placeholder="Get a free quote" onChange={event => changeSection("button_text", event.target.value)} /></label>
                  <label className={styles.field}><span>Button destination</span><Input value={document.section.button_route} maxLength={2048} placeholder="/contact-us" onChange={event => changeSection("button_route", event.target.value)} /><small>Use a page path, such as /contact-us, or a full HTTPS address.</small></label>
                </div>
                <label className={styles.field}><span>Bottom note</span><small>Optional supporting text below the button.</small><Textarea value={document.section.bottom_note} maxLength={1000} rows={2} placeholder="Residential & commercial" onChange={event => changeSection("bottom_note", event.target.value)} /></label>
              </div>
              <div id="panel-images" role="tabpanel" aria-labelledby="tab-images" hidden={tab !== "images"}>
                <ImageEditor images={document.section.images} disabled={busy} onBusyChange={setMediaBusy} onChange={images => { setDocument(current => current && (current.schemaVersion === 1 || current.schemaVersion === 3) ? { ...current, schemaVersion: 3, section: { ...current.section, images } } : current); setMessage(""); }} />
              </div>
              <div id="panel-details" role="tabpanel" aria-labelledby="tab-details" hidden={tab !== "details"}>
                <div className={styles.sectionIntro}><h3>Page & search details</h3><p>Give this section a name and choose how its test page appears in search results.</p></div>
                <label className={styles.field}><span>Page title <span className={styles.required}>*</span></span><Input value={document.title} maxLength={200} placeholder="Breeze services" onChange={event => changeDetails("title", event.target.value)} /></label>
                <label className={styles.field}><span>SEO title</span><Input value={document.seoTitle} maxLength={200} placeholder="Heating & cooling | Breeze" onChange={event => changeDetails("seoTitle", event.target.value)} /><small>Leave empty to use the page title.</small></label>
                <label className={styles.field}><span>SEO description</span><Textarea value={document.seoDescription} maxLength={500} rows={4} placeholder="A short description of the page." onChange={event => changeDetails("seoDescription", event.target.value)} /><small>{document.seoDescription.length} / 500 characters</small></label>
              </div>
              </>}
            </fieldset>
            <div className={styles.formFooter}><span>{dirty ? "Your changes are only in this editor." : `Saved ${dateText(baseDraft?.updatedAt)}`}</span>{dirty && <Button type="button" className={styles.textButton} disabled={busy} onClick={discardChanges}>Discard changes</Button>}</div>
          </form>
        </section>
        <section className={styles.previewPanel} aria-label="Live section preview">
          <div className={styles.previewHeading}><h2>Preview</h2><span className={styles.liveBadge}><span />Live</span></div>
          <div className={styles.previewControls}>
            <div className={styles.segmented} role="group" aria-label="Preview content"><button type="button" aria-pressed={previewMode === "draft"} onClick={() => setPreviewMode("draft")}>Your draft</button><button type="button" aria-pressed={previewMode === "published"} disabled={!state?.publication} onClick={() => setPreviewMode("published")}>Published</button></div>
            <div className={styles.segmented} role="group" aria-label="Preview screen size">{(["desktop", "tablet", "mobile"] as const).map(size => <button key={size} type="button" aria-pressed={viewport === size} onClick={() => setViewport(size)}>{size[0].toUpperCase() + size.slice(1)}</button>)}</div>
          </div>
          {previewDocument && (previewDocument.schemaVersion === 2 || previewDocument.schemaVersion === 4 || previewDocument.schemaVersion === 5 || previewDocument.schemaVersion === 6) ? <HomePreviewFrame document={previewDocument} viewport={viewport} /> : <div className={styles.previewCanvas}><div className={`${styles.previewFrame} ${styles[viewport]}`}>
            <div className={styles.browserBar}><span className={styles.browserDots}><i /><i /><i /></span><span>breeze / {pageId}</span><Icon name="shield" /></div>
            {previewDocument && <CmsProofContent document={previewDocument} preview />}
          </div></div>}
          {!previewValid && <p className={styles.previewCaption}>Complete the required fields before saving. The homepage preview keeps its last valid content.</p>}
          <p className={styles.previewCaption}>{previewMode === "draft" ? dirty ? "Showing your unsaved changes. Save a draft before publishing." : "Showing your saved draft." : state?.delivery?.confirmed_at ? "Showing the publication confirmed on the website." : "Showing the saved publication. Website delivery is still pending."} Preview buttons do not navigate.</p>
        </section>
      </div>
      <section className={styles.publishingPanel} aria-label="Publishing status">
        <div className={styles.publishingHeading}><h2>Publishing status</h2><a className={styles.publicLink} href={pages[pageId].path} target="_blank" rel="noreferrer">Open published page <span aria-hidden="true">↗</span></a></div>
        <div className={styles.steps}>
          <div className={styles.step}><Icon name={dirty ? "clock" : "check"} /><div><strong>{dirty ? "Unsaved changes" : "Draft saved"}</strong><span>{dirty ? "Save your edits to create a new draft." : `Draft ${baseDraft?.version} · ${dateText(baseDraft?.updatedAt)}`}</span></div></div>
          <div className={styles.step}><Icon name={state?.publication ? "check" : "clock"} /><div><strong>{state?.publication ? `Revision ${state.publication.version} published` : "Ready when you are"}</strong><span>{state?.publication ? dateText(state.publication.publishedAt) : "Publish a saved draft to update the website."}</span></div></div>
          <div className={`${styles.step} ${status.deliveryFailed ? styles.failedStep : ""}`}><Icon name={state?.delivery?.confirmed_at ? "check" : "clock"} /><div><strong>{status.deliveryLabel}</strong><span>{status.deliveryDetail}</span></div></div>
        </div>
        {state?.publication && !state.delivery?.confirmed_at && <div className={styles.deliveryNotice}>
          <p>{state.delivery?.last_error || (status.leaseActive ? `The website refresh is in progress. You can retry after ${new Date(state.delivery!.lease_until).toLocaleTimeString()}.` : "Your revision is published. Retry the website refresh to confirm it is visible.")} {state.delivery && <span>Attempts: {state.delivery.attempts}.</span>}</p>
          <Button className={styles.secondaryButton} disabled={busy || status.leaseActive} onClick={() => void act("retry")}>{operation === "retry" ? "Retrying refresh…" : "Retry cache refresh"}</Button>
        </div>}
        {dirty && <p className={styles.publishingNote}>Save your draft first. Publishing always uses the saved draft.</p>}
      </section>
    </>}
    {document && <div className={styles.saveBar} role="region" aria-label="Save and publish content">
      <div className={styles.saveSummary} aria-live="polite"><strong>{error ? "Action needs attention" : status.label}</strong><span>{error || (busy ? status.detail : newerDraft ? "Load the latest draft above before saving or publishing." : saveHelp)}</span></div>
      <div className={styles.actions}>
        <Button type="submit" form="cms-editor-form" className={dirty ? styles.primaryButton : styles.secondaryButton} disabled={saveDisabled}>{operation === "draft" ? "Saving draft…" : "1. Save draft"}</Button>
        <Button type="button" className={styles.primaryButton} disabled={publishDisabled} onClick={() => void act("publish")}><Icon name="check" />{operation === "publish" ? "Publishing…" : "2. Publish draft"}</Button>
      </div>
    </div>}
  </div></div></AdminShell>;
}
