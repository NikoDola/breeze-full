"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { homeSectionRegistry, homeRichSectionRegistry, homeSlotOrder, editableHome, type HomeDocument, type HomeSlot, type Field, type TextField } from "../../../cms/shared/home";
import type { RichText } from "../../../cms/shared/rich-text";
import styles from "./editor.module.css";
const RichTextEditor = dynamic(() => import("./RichTextEditor"), { ssr: false, loading: () => <p role="status">Loading heading editor…</p> });

function TextControl({ field, value, onChange }: { field: TextField; value: string; onChange: (value: string) => void }) {
  return <label className={styles.field}><span>{field.label}</span>
    {field.multiline ? <Textarea value={value} maxLength={field.max} rows={4} onChange={event => onChange(event.target.value)} />
      : <Input value={value} maxLength={field.max} onChange={event => onChange(event.target.value)} />}
    {field.help && <small>{field.help}</small>}
  </label>;
}

export default function HomeFields({ document, onChange, disabled, resetKey }: { document: HomeDocument; onChange: (document: HomeDocument) => void; disabled: boolean; resetKey: number }) {
  const [slot, setSlot] = useState<HomeSlot>("seasons");
  const schema = homeRichSectionRegistry[slot];
  const editable = editableHome(document);
  const content = editable.slots[slot].content as unknown as Record<string, unknown>;
  function change(key: string, value: unknown) {
    if (disabled) return;
    onChange({ ...editable, slots: { ...editable.slots, [slot]: { ...editable.slots[slot], content: { ...content, [key]: value } } } } as HomeDocument);
  }
  return <>
    <div className={styles.sectionIntro}><h3>Homepage sections</h3><p>The hero, contact form, and section order are maintained by your website developer.</p></div>
    <div className={styles.sectionPicker} role="group" aria-label="Homepage section">
      {homeSlotOrder.map(key => <button key={key} type="button" aria-pressed={slot === key} onClick={() => setSlot(key)}>{homeSectionRegistry[key].label}</button>)}
    </div>
    <div className={styles.sectionIntro}><h3>{schema.label}</h3><p>{schema.help}</p></div>
    {(Object.entries(schema.fields) as [string, Field][]).map(([key, field]) => {
      if (field.kind === "text") return <TextControl key={`${slot}-${key}`} field={field} value={content[key] as string} onChange={value => change(key, value)} />;
      if (field.kind === "rich-text") return <RichTextEditor key={`${slot}-${key}-${resetKey}`} value={content[key] as RichText} label={field.label} help={field.help} disabled={disabled} onChange={value => change(key, value)} />;
      const items = content[key] as Record<string, string>[];
      function move(index: number, step: number) {
        const next = [...items]; [next[index], next[index + step]] = [next[index + step], next[index]]; change(key, next);
      }
      return <div className={styles.repeatedGroup} key={`${slot}-${key}`}><h4>{field.label}</h4>
        {items.map((item, index) => <fieldset key={item.id} className={styles.repeatedItem}>
          <legend>{field.fixedIds ? item.id === "cooling" ? "Cooling card" : "Heating card" : `Review ${index + 1}`}</legend>
          {Object.entries(field.fields).map(([childKey, childField]) => <TextControl key={childKey} field={childField} value={item[childKey]} onChange={value => change(key, items.map((entry, at) => at === index ? { ...entry, [childKey]: value } : entry))} />)}
          {!field.fixedIds && <div className={styles.itemActions}>
            <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={`Move review ${index + 1} earlier`}>↑ Earlier</button>
            <button type="button" disabled={index === items.length - 1} onClick={() => move(index, 1)} aria-label={`Move review ${index + 1} later`}>↓ Later</button>
            <button type="button" disabled={items.length <= field.min} onClick={() => { if (window.confirm(`Remove ${item.name || "this review"} from this draft?`)) change(key, items.filter((_, at) => at !== index)); }}>Remove</button>
          </div>}
        </fieldset>)}
        {!field.fixedIds && <button type="button" className={styles.secondaryButton} disabled={items.length >= field.max} onClick={() => change(key, [...items, { id: crypto.randomUUID(), ...Object.fromEntries(Object.keys(field.fields).map(name => [name, ""])) }])}>+ Add review</button>}
      </div>;
    })}
  </>;
}
