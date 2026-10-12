"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Icon from "@/components/ui/Icon";
import CmsImage from "@/components/sections/CmsImage";
import { cmsImageSource, cmsSiteImages } from "@/lib/cms/images";
import styles from "./editor.module.css";
import imageStyles from "./images.module.css";

export default function ImageEditor({ images, onChange, disabled }: { images: string[]; onChange: (images: string[]) => void; disabled: boolean }) {
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [showSiteImages, setShowSiteImages] = useState(false);
  const full = images.length >= 12;
  function add(reference: string) {
    if (disabled || full) return;
    if (!cmsImageSource(reference)) { setError("Use an image path, such as /images/photo.jpg, or a full HTTPS image address."); return; }
    onChange([...images, reference.trim()]); setAddress(""); setError("");
  }
  function move(index: number, step: number) {
    const next = [...images]; [next[index], next[index + step]] = [next[index + step], next[index]]; onChange(next);
  }
  return <div>
    <div className={styles.sectionIntro}><h3>Bring your section to life</h3><p>Choose a Breeze image or paste an image address. Multiple images appear as a slider.</p></div>
    <div className={imageStyles.imageSummary}><span>{images.length} / 12 images</span><Button type="button" className={styles.textButton} disabled={disabled || full} onClick={() => setShowSiteImages(!showSiteImages)}><Icon name="image" />{showSiteImages ? "Hide site images" : "Choose a site image"}</Button></div>
    {showSiteImages && <div className={imageStyles.library} aria-label="Existing Breeze images">{cmsSiteImages.map(image => <button type="button" key={image.source} disabled={disabled || full} onClick={() => add(image.source)} aria-label={`Add ${image.label}`}>
      <span className={imageStyles.libraryThumb}><CmsImage reference={image.source} sizes="180px" thumbnail /></span><span>{image.label}</span>
    </button>)}</div>}
    <ol className={imageStyles.imageList}>{images.map((reference, index) => <li key={index}>
      <div className={imageStyles.imageCard}><div className={imageStyles.thumbnail}><CmsImage reference={reference} sizes="100px" thumbnail /></div><div className={imageStyles.imageFields}>
        <label className={imageStyles.imageLabel}><span>Image {index + 1}</span><Input aria-label={`Image ${index + 1} address`} value={reference} maxLength={2048} placeholder="/images/photo.jpg" onChange={event => onChange(images.map((value, position) => position === index ? event.target.value : value))} /></label>
        <div className={imageStyles.imageActions}><button type="button" disabled={disabled || index === 0} onClick={() => move(index, -1)} aria-label={`Move image ${index + 1} earlier`}>↑ <span>Earlier</span></button><button type="button" disabled={disabled || index === images.length - 1} onClick={() => move(index, 1)} aria-label={`Move image ${index + 1} later`}>↓ <span>Later</span></button><button type="button" className={imageStyles.remove} disabled={disabled} onClick={() => onChange(images.filter((_, position) => position !== index))} aria-label={`Remove image ${index + 1}`}>Remove</button></div>
        {!cmsImageSource(reference) && <small className={imageStyles.referenceWarning}>This reference cannot be displayed. Replace its address or remove it.</small>}
      </div></div>
    </li>)}</ol>
    {!images.length && <div className={imageStyles.noImages}><Icon name="image" /><strong>No images yet</strong><p>Your section works with text alone. Add an image whenever you are ready.</p></div>}
    <div className={imageStyles.addImage}>
      <label className={styles.field}><span>Add an image address</span><Input value={address} maxLength={2048} placeholder="https://… or /images/photo.jpg" disabled={disabled || full} onChange={event => { setAddress(event.target.value); setError(""); }} onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); add(address); } }} /></label>
      <Button type="button" className={styles.secondaryButton} disabled={disabled || full || !address.trim()} onClick={() => add(address)}>+ Add image</Button>
      {error && <p className={imageStyles.referenceWarning} role="alert">{error}</p>}
      {full && <p className={imageStyles.help}>This section has reached its limit of 12 images.</p>}
    </div>
    <p className={imageStyles.help}>Removing an image here removes its reference from this draft. It does not delete the image file. Uploads and alt-text editing will be added with the media library.</p>
  </div>;
}
