"use client";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { contentDefinitions, emptyContent, type ContentDocument, type ContentField, type ContentRecord } from "../../../cms/shared/content";
import styles from "./editor.module.css";
import ImageEditor from "./ImageEditor";
import { gallerySource } from "../../../cms/shared/additional-content";
import type { ImageReference } from "../../../cms/shared/media";

function PhotoField({ value, onChange, disabled, onBusyChange }: { value: ImageReference; onChange: (value: ImageReference) => void; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return <div><button className={styles.secondaryButton} type="button" onClick={() => setOpen(!open)}>{open ? "Close photo selection" : "Choose or upload photo"}</button>
    {open && <ImageEditor images={value ? [value] : []} onChange={next => onChange(next[0] ?? "")} disabled={disabled} onBusyChange={onBusyChange} limit={1} allowPath={false} siteImages={gallerySource.map(photo => ({ label: photo.caption, source: photo.image }))} />}
  </div>;
}
function Fields({ fields, content, onChange, disabled, onBusyChange }: { fields: Record<string, ContentField>; content: ContentRecord; onChange: (content: ContentRecord) => void; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  return <>{Object.entries(fields).map(([key, field]) => {
    const update = (value: ContentRecord[string]) => onChange({ ...content, [key]: value });
    if (field.kind === "image") return <PhotoField key={key} value={content[key] as ImageReference} onChange={update} disabled={disabled} onBusyChange={onBusyChange} />;
    if (field.kind === "text") return <label className={styles.field} key={key}><span>{field.label}{field.optional ? " (optional)" : ""}</span>
      {field.choices ? <select value={content[key] as string} onChange={event => update(event.target.value)}>{field.choices.map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select>
        : field.multiline ? <Textarea value={content[key] as string} maxLength={field.max} rows={4} onChange={event => update(event.target.value)} />
        : <Input value={content[key] as string} maxLength={field.max} onChange={event => update(event.target.value)} />}
    </label>;
    const items = content[key] as ContentRecord[];
    function move(index: number, step: number) { const next = [...items]; [next[index], next[index + step]] = [next[index + step], next[index]]; update(next); }
    return <div className={styles.repeatedGroup} key={key}><h3>{field.label}</h3>
      {items.map((item, index) => <details className={styles.collectionItem} key={item.id as string} open={items.length < 4}>
        <summary>{index + 1}. {String(item.heading || item.caption || item.text || item.type || "New item").slice(0, 90)}</summary>
        <div className={styles.collectionBody}><Fields fields={field.fields} content={item} disabled={disabled} onBusyChange={onBusyChange} onChange={next => update(items.map((entry, at) => at === index ? next : entry))} />
          {!field.fixedIds && <div className={styles.itemActions}>
            <button type="button" disabled={index === 0} aria-label={`Move ${field.label} item ${index + 1} earlier`} onClick={() => move(index, -1)}>Earlier</button>
            <button type="button" disabled={index === items.length - 1} aria-label={`Move ${field.label} item ${index + 1} later`} onClick={() => move(index, 1)}>Later</button>
            <button type="button" disabled={items.length <= field.min} onClick={() => { if (window.confirm("Remove this item from the draft?")) update(items.filter((_, at) => at !== index)); }}>Remove</button>
          </div>}
        </div>
      </details>)}
      {!field.fixedIds && <button type="button" className={styles.secondaryButton} disabled={items.length >= field.max} onClick={() => update([...items, { id: crypto.randomUUID(), ...emptyContent(field.fields) }])}>+ Add {field.label.toLowerCase() === "careers cards" ? "card" : "item"}</button>}
      <p className={styles.previewCaption}>{items.length} / {field.max}</p>
    </div>;
  })}</>;
}
export default function ContentFields({ document, onChange, disabled, onBusyChange }: { document: ContentDocument; onChange: (document: ContentDocument) => void; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const [tab, setTab] = useState<"content" | "details">("content");
  return <>
    <div className={styles.sectionPicker} role="group" aria-label="Page fields"><button type="button" aria-pressed={tab === "content"} onClick={() => setTab("content")}>Page content</button><button type="button" aria-pressed={tab === "details"} onClick={() => setTab("details")}>Search settings</button></div>
    {tab === "content" ? <Fields fields={contentDefinitions[document.pageId].fields} content={document.content} disabled={disabled} onBusyChange={onBusyChange} onChange={content => onChange({ ...document, content })} /> : <>
      <label className={styles.field}><span>Internal page title</span><Input maxLength={200} value={document.title} onChange={event => onChange({ ...document, title: event.target.value })} /></label>
      <label className={styles.field}><span>Search title</span><Input maxLength={200} value={document.seoTitle} onChange={event => onChange({ ...document, seoTitle: event.target.value })} /></label>
      <label className={styles.field}><span>Search description</span><Textarea rows={3} maxLength={500} value={document.seoDescription} onChange={event => onChange({ ...document, seoDescription: event.target.value })} /></label>
    </>}
  </>;
}
