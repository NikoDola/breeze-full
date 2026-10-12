"use client";

import { useState } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { cmsImageSource } from "@/lib/cms/images";
import { mediaDelivery } from "@/lib/cms/media-delivery";
import type { ImageReference } from "../../../cms/shared/media";
import styles from "./cms-proof.module.css";

export default function CmsImage({ reference, sizes = "(max-width: 700px) 90vw, 700px", thumbnail = false, preview = false, mediaOrigin }: { reference: ImageReference; sizes?: string; thumbnail?: boolean; preview?: boolean; mediaOrigin?: string }) {
  const media = typeof reference !== "string";
  const source = media ? mediaDelivery(reference, preview, thumbnail, mediaOrigin) : cmsImageSource(reference);
  return <ImageFrame key={source ?? String(reference)} source={source} sizes={sizes} thumbnail={thumbnail} alt={media ? reference.alt : ""} unoptimized={media ? preview : !source?.startsWith("/")} />;
}
function ImageFrame({ source, sizes, thumbnail, alt, unoptimized }: { source: string | null; sizes: string; thumbnail: boolean; alt: string; unoptimized: boolean }) {
  const [failed, setFailed] = useState(false);
  return <div className={styles.imageFrame}>
    {source && !failed ? <Image src={source} alt={alt} fill sizes={sizes} loading="lazy" unoptimized={unoptimized} referrerPolicy="no-referrer" onError={() => setFailed(true)} />
      : <div className={styles.unavailable}><Icon name="image" /><span>{thumbnail ? "Unavailable" : "This image is unavailable"}</span></div>}
  </div>;
}
