"use client";

import { useState } from "react";
import CmsImage from "./CmsImage";
import type { ImageReference } from "../../../cms/shared/media";
import styles from "./cms-proof.module.css";

export default function CmsSectionImages({ images, preview = false, mediaOrigin }: { images: ImageReference[]; preview?: boolean; mediaOrigin?: string }) {
  const [selected, setSelected] = useState(0);
  if (!images.length) return null;
  const active = Math.min(selected, images.length - 1);
  const multiple = images.length > 1;
  function move(step: number) { setSelected((active + step + images.length) % images.length); }
  return <div className={styles.gallery} role={multiple ? "region" : undefined} aria-roledescription={multiple ? "carousel" : undefined} aria-label="Section images"
    tabIndex={multiple ? 0 : undefined} onKeyDown={event => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); }
    }}>
    <div className={styles.slide} role={multiple ? "group" : undefined} aria-roledescription={multiple ? "slide" : undefined} aria-label={`Image ${active + 1} of ${images.length}`}>
      <CmsImage reference={images[active]} preview={preview} mediaOrigin={mediaOrigin} />
    </div>
    {multiple && <div className={styles.galleryControls}>
      <button type="button" onClick={() => move(-1)} aria-label="Previous image"><span aria-hidden="true">←</span></button>
      <span aria-live="polite" aria-atomic="true">{active + 1} / {images.length}</span>
      <button type="button" onClick={() => move(1)} aria-label="Next image"><span aria-hidden="true">→</span></button>
    </div>}
  </div>;
}
