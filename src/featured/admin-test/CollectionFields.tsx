"use client";

import { useState } from "react";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import ReviewCard from "@/components/ui/ReviewCard";
import { favoriteReviews, orderedReviews, socialPlatforms, reviewPageDefaults, type ReviewsDocument, type GlobalDocument, type SocialPlatform } from "../../../cms/shared/collections";
import styles from "./editor.module.css";
import { site } from "@/lib/site";
import { directionsLink, type BusinessAddress } from "../../../cms/shared/location";
import type { SharedCopy } from "../../../cms/shared/shared-copy";

export function ReviewsFields({ document, onChange }: { document: ReviewsDocument; onChange: (document: ReviewsDocument) => void }) {
  const [openIds, setOpenIds] = useState<string[]>([]);
  const change = (id: string, patch: Partial<ReviewsDocument["items"][number]>) => onChange({ ...document,
    items: document.items.map(item => item.id === id ? { ...item, ...patch } : item),
    favoriteIds: patch.visible === false ? document.favoriteIds.filter(value => value !== id) : document.favoriteIds });
  function moveFavorite(index: number, step: number) {
    const favoriteIds = [...document.favoriteIds];
    [favoriteIds[index], favoriteIds[index + step]] = [favoriteIds[index + step], favoriteIds[index]];
    onChange({ ...document, favoriteIds });
  }
  return <>
    <div className={styles.sectionIntro}><h3>Review library</h3><p>All visible reviews appear on the Client page. Choose up to three favorites for the homepage. Changes go live only after publishing.</p></div>
    <details className={styles.collectionItem}><summary>Reviews page headings and search settings</summary><div className={styles.collectionBody}>{Object.entries(document.page ?? reviewPageDefaults).map(([key, value]) => <label className={styles.field} key={key}><span>{key.replace(/([A-Z])/g, " $1").replace(/^./, first => first.toUpperCase())}</span><Input value={value} maxLength={key === "seoDescription" ? 500 : 200} onChange={event => onChange({ ...document, page: { ...(document.page ?? reviewPageDefaults), [key]: event.target.value } })} /></label>)}</div></details>
    <div className={styles.fieldGroup}><h3>Homepage favorites ({document.favoriteIds.length}/3)</h3>
      {!document.favoriteIds.length && <p>No favorites selected. The homepage review cards will be hidden after publishing.</p>}
      {document.favoriteIds.map((id, index) => <div className={styles.favoriteRow} key={id}><strong>{index + 1}. {document.items.find(item => item.id === id)?.name}</strong><div className={styles.itemActions}>
        <button type="button" disabled={index === 0} onClick={() => moveFavorite(index, -1)} aria-label={`Move favorite ${index + 1} earlier`}>Earlier</button>
        <button type="button" disabled={index === document.favoriteIds.length - 1} onClick={() => moveFavorite(index, 1)} aria-label={`Move favorite ${index + 1} later`}>Later</button>
      </div></div>)}
    </div>
    <button type="button" className={styles.secondaryButton} disabled={document.items.length >= 50} onClick={() => { const id = crypto.randomUUID(); setOpenIds([...openIds, id]); onChange({ ...document, items: [...document.items, { id, name: "", quote: "", homeQuote: "", visible: true }] }); }}>+ Add review</button>
    <p className={styles.previewCaption}>{document.items.length} / 50 reviews. Add genuine client feedback with permission to display it.</p>
    {document.items.map((item, index) => <details className={styles.collectionItem} key={item.id} open={openIds.includes(item.id)} onToggle={event => { const open = event.currentTarget.open; setOpenIds(ids => open ? ids.includes(item.id) ? ids : [...ids, item.id] : ids.filter(id => id !== item.id)); }}>
      <summary>{index + 1}. {item.name || "New review"}<span>{document.favoriteIds.includes(item.id) ? "Homepage favorite" : item.visible ? "Client page" : "Hidden"}</span></summary>
      <div className={styles.collectionBody}>
        <label className={styles.field}><span>Reviewer name</span><Input value={item.name} maxLength={180} onChange={event => change(item.id, { name: event.target.value })} /></label>
        <label className={styles.field}><span>Full review</span><Textarea value={item.quote} maxLength={4000} rows={6} onChange={event => change(item.id, { quote: event.target.value })} /></label>
        <label className={styles.field}><span>Homepage excerpt (optional)</span><small>Use the original review wording. Leave empty to show the full review. Short excerpts work best on the homepage.</small><Textarea value={item.homeQuote} maxLength={3000} rows={3} onChange={event => change(item.id, { homeQuote: event.target.value })} /></label>
        <label className={styles.checkField}><input type="checkbox" checked={item.visible} onChange={event => change(item.id, { visible: event.target.checked })} />Show this review</label>
        <label className={styles.checkField}><input type="checkbox" checked={document.favoriteIds.includes(item.id)} disabled={!item.visible || (!document.favoriteIds.includes(item.id) && document.favoriteIds.length >= 3)} onChange={event => onChange({ ...document, favoriteIds: event.target.checked ? [...document.favoriteIds, item.id] : document.favoriteIds.filter(id => id !== item.id) })} />Homepage favorite</label>
        <button type="button" className={styles.textButton} onClick={() => { if (window.confirm(`Remove ${item.name || "this review"} from this draft? Published history will be retained.`)) onChange({ ...document, items: document.items.filter(review => review.id !== item.id), favoriteIds: document.favoriteIds.filter(id => id !== item.id) }); }}>Remove review</button>
      </div>
    </details>)}
  </>;
}

export function GlobalFields({ document, onChange }: { document: GlobalDocument; onChange: (document: GlobalDocument) => void }) {
  const address = document.address ?? site.address;
  const addressFields: [keyof BusinessAddress, string, number][] = [["street", "Street address", 200], ["city", "City", 100], ["state", "State / region", 100], ["zip", "Postal code", 30], ["country", "Country", 100]];
  return <>
    <div className={styles.sectionIntro}><h3>Business contact details</h3><p>Publishing updates contact links and form email recipients throughout the website. Admin support details remain separate.</p></div>
    <label className={styles.field}><span>Phone number</span><Input type="tel" value={document.phone} maxLength={40} onChange={event => onChange({ ...document, phone: event.target.value })} /><small>Include a country code for numbers outside the US.</small></label>
    <label className={styles.field}><span>Public email</span><Input type="email" value={document.email} maxLength={254} onChange={event => onChange({ ...document, formRecipientEmail: document.formRecipientEmail ?? document.email, email: event.target.value })} /><small>Displayed in website contact links and contact information.</small></label>
    <label className={styles.field}><span>Form recipient email</span><Input type="email" value={document.formRecipientEmail ?? document.email} maxLength={254} onChange={event => onChange({ ...document, formRecipientEmail: event.target.value })} /><small>Receives service requests and careers applications. Forms open the visitor's email app with this recipient.</small></label>
    <div className={styles.sectionIntro}><h3>Business location</h3><p>The address updates Contact us and legal contact details. The map follows this address.</p></div>
    {addressFields.map(([key, label, max]) => <label className={styles.field} key={key}><span>{label}</span><Input value={address[key]} maxLength={max} onChange={event => {
      const next = { ...address, [key]: event.target.value };
      const mapsHref = !document.mapsHref || document.mapsHref === directionsLink(address) ? directionsLink(next) : document.mapsHref;
      onChange({ ...document, address: next, mapsHref });
    }} /></label>)}
    <label className={styles.field}><span>Google Maps directions link</span><Input type="url" value={document.mapsHref ?? directionsLink(address)} maxLength={2048} onChange={event => onChange({ ...document, address, mapsHref: event.target.value })} /><small>Paste the business's Google Maps link, or use the address to generate one.</small></label>
    <button type="button" className={styles.secondaryButton} onClick={() => onChange({ ...document, address, mapsHref: directionsLink(address) })}>Use address for directions</button>
    <div className={styles.sectionIntro}><h3>Social media</h3><p>Choose a platform and paste the full HTTPS link to your business profile. Published links appear in the footer.</p></div>
    {document.socials.map((link, index) => <fieldset className={styles.repeatedItem} key={index}><legend>Social link {index + 1}</legend>
      <label className={styles.field}><span>Platform</span><select value={link.platform} onChange={event => onChange({ ...document, socials: document.socials.map((item, at) => at === index ? { platform: event.target.value as SocialPlatform, href: "" } : item) })}>
        {Object.entries(socialPlatforms).map(([platform, { label }]) => <option value={platform} key={platform} disabled={document.socials.some((item, at) => at !== index && item.platform === platform)}>{label}</option>)}
      </select></label>
      <label className={styles.field}><span>Profile URL</span><Input type="url" value={link.href} maxLength={2048} placeholder={`https://www.${socialPlatforms[link.platform].hosts[0]}/your-profile`} onChange={event => onChange({ ...document, socials: document.socials.map((item, at) => at === index ? { ...item, href: event.target.value } : item) })} /></label>
      <button type="button" className={styles.textButton} onClick={() => onChange({ ...document, socials: document.socials.filter((_, at) => at !== index) })}>Remove social link</button>
    </fieldset>)}
    <button type="button" className={styles.secondaryButton} disabled={document.socials.length >= Object.keys(socialPlatforms).length} onClick={() => {
      const platform = (Object.keys(socialPlatforms) as SocialPlatform[]).find(key => !document.socials.some(link => link.platform === key));
      if (platform) onChange({ ...document, socials: [...document.socials, { platform, href: "" }] });
    }}>+ Add social link</button>
    <div className={styles.sectionIntro}><h3>Shared page text</h3></div>
    {Object.entries(document.sharedCopy ?? site.sharedCopy).map(([group, fields]) => <details className={styles.collectionItem} key={group}><summary>{group === "cta" ? "Contact banner" : "Service callouts"}</summary><div className={styles.collectionBody}>
      {Object.entries(fields).map(([key, value]) => <label className={styles.field} key={key}><span>{key.replace(/([A-Z])/g, " $1").replace(/^./, first => first.toUpperCase())}</span><Textarea rows={key.toLowerCase().includes("body") ? 3 : 1} maxLength={key.toLowerCase().includes("body") ? 3000 : 300} value={value} onChange={event => onChange({ ...document, sharedCopy: { ...(document.sharedCopy ?? site.sharedCopy), [group]: { ...fields, [key]: event.target.value } } as SharedCopy })} /></label>)}
    </div></details>)}
  </>;
}

export function CollectionPreview({ document }: { document: ReviewsDocument }) {
  const [view, setView] = useState<"home" | "client">("home");
  return <div className={styles.collectionPreview}>
    <div className={styles.segmented} role="group" aria-label="Review preview"><button type="button" aria-pressed={view === "home"} onClick={() => setView("home")}>Homepage</button><button type="button" aria-pressed={view === "client"} onClick={() => setView("client")}>Client page</button></div>
    <h3>{view === "home" ? "Homepage favorites" : "Client reviews"}</h3><p>{document.items.filter(item => item.visible).length} reviews visible on the Client page.</p>
    {(view === "home" ? favoriteReviews(document) : orderedReviews(document)).map(item => <ReviewCard key={item.id} name={item.name} quote={item.quote} collapsible={view === "client"} />)}
    {view === "home" && !document.favoriteIds.length && <p>No homepage review cards selected.</p>}
  </div>;
}
