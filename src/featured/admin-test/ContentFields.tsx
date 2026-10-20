"use client";
import { useState } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { contentDefinitions, emptyContent, type ContentDocument, type ContentField, type ContentRecord } from "../../../cms/shared/content";
import styles from "./editor.module.css";
import ImageEditor from "./ImageEditor";
import OgImageField from "./OgImageField";
import CmsImage from "@/components/sections/CmsImage";
import { gallerySource } from "../../../cms/shared/additional-content";
import type { ImageReference } from "../../../cms/shared/media";
import HeroImageField from "./HeroImageField";
import promotionSource from "@/content/promotions.json";
import type { OfferHeroImages } from "../../../cms/shared/hero-image";

function PhotoField({ value, onChange, disabled, onBusyChange }: { value: ImageReference; onChange: (value: ImageReference) => void; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const [open, setOpen] = useState(false);
  return <div className={styles.photoField}><div className={styles.photoCurrent}>{value && <CmsImage reference={value} sizes="100px" thumbnail preview />}<button className={styles.secondaryButton} type="button" onClick={() => setOpen(!open)}>{open ? "Close photo picker" : value ? "Replace photo" : "Choose photo"}</button></div>
    {open && <ImageEditor images={value ? [value] : []} onChange={next => { onChange(next[0] ?? ""); setOpen(false); }} disabled={disabled} onBusyChange={onBusyChange} limit={1} allowPath={false} singlePicker siteImages={gallerySource.map(photo => ({ label: photo.caption, source: photo.image }))} />}
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
        <summary className={key === "photos" ? styles.photoSummary : undefined}>{key === "photos" && item.image && <span className={styles.photoSummaryThumb}><CmsImage reference={item.image as ImageReference} sizes="80px" thumbnail preview /></span>}<span>{index + 1}. {String(item.heading || item.caption || item.text || item.type || "New item").slice(0, 90)}</span></summary>
        <div className={styles.collectionBody}><Fields fields={field.fields} content={item} disabled={disabled} onBusyChange={onBusyChange} onChange={next => update(items.map((entry, at) => at === index ? next : entry))} />
          {!field.fixedIds && <div className={styles.itemActions}>
            <button type="button" disabled={index === 0} aria-label={`Move ${field.label} item ${index + 1} earlier`} onClick={() => move(index, -1)}>Earlier</button>
            <button type="button" disabled={index === items.length - 1} aria-label={`Move ${field.label} item ${index + 1} later`} onClick={() => move(index, 1)}>Later</button>
            <button type="button" disabled={items.length <= field.min} onClick={() => { if (window.confirm("Remove this item from the draft?")) update(items.filter((_, at) => at !== index)); }}>Remove</button>
          </div>}
        </div>
      </details>)}
      {!field.fixedIds && <button type="button" className={styles.secondaryButton} disabled={items.length >= field.max} onClick={() => update([...items, { id: crypto.randomUUID(), ...emptyContent(field.fields) }])}>+ Add {key === "photos" ? "photo" : field.label.toLowerCase() === "careers cards" ? "card" : "item"}</button>}
      <p className={styles.previewCaption}>{items.length} / {field.max}</p>
    </div>;
  })}</>;
}
export default function ContentFields({ document, onChange, disabled, onBusyChange }: { document: ContentDocument; onChange: (document: ContentDocument) => void; disabled: boolean; onBusyChange: (busy: boolean) => void }) {
  const [tab, setTab] = useState<"content" | "details">("content");
  const pageFields = contentDefinitions[document.pageId].fields;
  const introFields = Object.fromEntries(Object.entries(pageFields).filter(([key]) => ["heading", "eyebrow", "tagline"].includes(key)));
  const bodyFields = Object.fromEntries(Object.entries(pageFields).filter(([key]) => !["heading", "eyebrow", "tagline"].includes(key)));
  return <>
    <div className={styles.sectionPicker} role="group" aria-label="Page fields"><button type="button" aria-pressed={tab === "content"} onClick={() => setTab("content")}>Page content</button><button type="button" aria-pressed={tab === "details"} onClick={() => setTab("details")}>Search settings</button></div>
    {tab === "content" ? <>{Object.keys(introFields).length > 0 && <><div className={styles.sectionIntro}><h3>Page introduction</h3><p>These fields appear near the top of the page.</p></div><Fields fields={introFields} content={document.content} disabled={disabled} onBusyChange={onBusyChange} onChange={content => onChange({ ...document, content })} /></>}
      <HeroImageField value={document.heroImage} fallback={contentDefinitions[document.pageId].image} onChange={heroImage => onChange({ ...document, heroImage })} disabled={disabled} onBusyChange={onBusyChange} />
      {document.pageId === "promotions" && <details className={styles.collectionItem}><summary>Seasonal page hero images</summary><div className={styles.collectionBody}>{promotionSource.items.map(offer => {
        const id = offer.slug as keyof OfferHeroImages;
        return <HeroImageField key={id} label={`${offer.title} hero image`} value={document.offerHeroImages?.[id]} fallback={offer.image} onChange={image => onChange({ ...document, offerHeroImages: { ...document.offerHeroImages, [id]: image } })} disabled={disabled} onBusyChange={onBusyChange} />;
      })}</div></details>}
      {Object.keys(bodyFields).length > 0 && <><div className={styles.sectionIntro}><h3>Main content</h3><p>Edit the sections people see as they scroll down.</p></div><Fields fields={bodyFields} content={document.content} disabled={disabled} onBusyChange={onBusyChange} onChange={content => onChange({ ...document, content })} /></>}</> : <>
      <div className={styles.sectionIntro}><h3>Search result preview</h3><p>The title and description below can appear in search results. Search engines may choose different text.</p></div>
      <div className={styles.searchSnippet}><strong>{document.seoTitle || document.title}</strong><span>{document.seoDescription}</span></div>
      <label className={styles.field}><span>Search title</span><Input maxLength={200} value={document.seoTitle} onChange={event => onChange({ ...document, seoTitle: event.target.value })} /></label>
      <label className={styles.field}><span>Search description</span><Textarea rows={3} maxLength={500} value={document.seoDescription} onChange={event => onChange({ ...document, seoDescription: event.target.value })} /></label>
      <OgImageField value={document.ogImage} onChange={ogImage => onChange({ ...document, ogImage })} disabled={disabled} onBusyChange={onBusyChange} />
      <details className={styles.advancedField}><summary>Internal page label</summary><label className={styles.field}><span>Editor label</span><Input maxLength={200} value={document.title} onChange={event => onChange({ ...document, title: event.target.value })} /><small>Used to identify this page in the editor.</small></label></details>
    </>}
  </>;
}
