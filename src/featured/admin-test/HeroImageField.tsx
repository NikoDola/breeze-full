"use client";

import { useId, useState } from "react";
import CmsImage from "@/components/sections/CmsImage";
import { heroImageOptions } from "../../../cms/shared/hero-image";
import type { ImageReference } from "../../../cms/shared/media";
import ImageEditor from "./ImageEditor";
import styles from "./editor.module.css";

export default function HeroImageField({ value, fallback, label = "Hero image", onChange, disabled, onBusyChange }: {
  value?: ImageReference | null;
  fallback: string;
  label?: string;
  onChange: (image: ImageReference | null) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickerId = useId();
  const current = value || fallback;
  return <div className={styles.heroImageField}>
    <div className={styles.sectionIntro}><h3>{label}</h3><p>The banner photo at the top of this page. Choose a wide image; it will be cropped to fill the banner.</p></div>
    {current && <div className={styles.heroImagePreview}><CmsImage reference={current} sizes="(max-width: 700px) 90vw, 440px" preview /></div>}
    <div className={styles.itemActions}>
      <button type="button" className={styles.secondaryButton} disabled={disabled} aria-expanded={open} aria-controls={pickerId} onClick={() => setOpen(!open)}>{open ? "Close hero image picker" : current ? "Replace hero image" : "Upload or choose hero image"}</button>
      {value && <button type="button" className={styles.textButton} disabled={disabled} onClick={() => { onChange(null); setOpen(false); }}>Restore default hero</button>}
    </div>
    {open && <div id={pickerId}><ImageEditor images={value ? [value] : []} onChange={images => { onChange(images[0] ?? null); setOpen(false); }} disabled={disabled} onBusyChange={onBusyChange} limit={1} allowPath={false} singlePicker siteImages={heroImageOptions} /></div>}
  </div>;
}
