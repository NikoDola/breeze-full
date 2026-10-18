"use client";
import { useId, useState } from "react";
import CmsImage from "@/components/sections/CmsImage";
import { gallerySource } from "../../../cms/shared/additional-content";
import type { ImageReference } from "../../../cms/shared/media";
import ImageEditor from "./ImageEditor";
import styles from "./editor.module.css";

const siteImages = gallerySource.map(photo => ({ label: photo.caption, source: photo.image }));

export default function OgImageField({ value, onChange, disabled, onBusyChange }: {
  value?: ImageReference | null;
  onChange: (image: ImageReference | null) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const pickerId = useId();
  return <div className={styles.ogImageField}>
    <div className={styles.sectionIntro}><h3>OG image (optional)</h3><p>Shown when this page is shared on social media or in messages. Use a wide image, ideally 1200 × 630 pixels.</p></div>
    {value && <div className={styles.ogImagePreview}><CmsImage reference={value} sizes="(max-width: 700px) 90vw, 440px" preview /></div>}
    <div className={styles.itemActions}>
      <button type="button" className={styles.secondaryButton} disabled={disabled} aria-expanded={open} aria-controls={pickerId} onClick={() => setOpen(!open)}>{open ? "Close image picker" : value ? "Replace OG image" : "Upload or choose OG image"}</button>
      {value && <button type="button" className={styles.textButton} disabled={disabled} onClick={() => { onChange(null); setOpen(false); }}>Remove OG image</button>}
    </div>
    {open && <div id={pickerId}><ImageEditor images={value ? [value] : []} onChange={images => { onChange(images[0] ?? null); setOpen(false); }} disabled={disabled} onBusyChange={onBusyChange} limit={1} allowPath={false} singlePicker siteImages={siteImages} /></div>}
  </div>;
}
