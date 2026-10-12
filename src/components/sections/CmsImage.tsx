"use client";

import { useState } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { cmsImageSource } from "@/lib/cms/images";
import styles from "./cms-proof.module.css";

export default function CmsImage({ reference, sizes = "(max-width: 700px) 90vw, 700px", thumbnail = false }: { reference: string; sizes?: string; thumbnail?: boolean }) {
  const source = cmsImageSource(reference);
  return <ImageFrame key={source ?? reference} source={source} sizes={sizes} thumbnail={thumbnail} />;
}
function ImageFrame({ source, sizes, thumbnail }: { source: string | null; sizes: string; thumbnail: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className={styles.imageFrame}>
    {source && !failed ? <Image src={source} alt="" fill sizes={sizes} loading="lazy" unoptimized={!source.startsWith("/")} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      : <div className={styles.unavailable}><Icon name="image" /><span>{thumbnail ? "Unavailable" : "This image is unavailable"}</span></div>}
  </div>;
}
