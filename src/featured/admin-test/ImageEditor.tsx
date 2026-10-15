"use client";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import CmsImage from "@/components/sections/CmsImage";
import { cmsImageSource, cmsSiteImages } from "@/lib/cms/images";
import { MAX_UPLOAD_BYTES, type ImageReference, type MediaAsset, type MediaPlacement } from "../../../cms/shared/media";
import styles from "./editor.module.css";
import css from "./images.module.css";

async function mediaRequest(body?: Record<string, unknown>, query = "") {
  const response = await fetch(`/api/cms/media${query}`, { method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store",
    headers: { "Content-Type": "application/json", "x-cms-request": "editor" }, body: body ? JSON.stringify(body) : undefined });
  let value;
  try { value = await response.json(); } catch { throw new Error("The media library could not respond. Refresh and try again."); }
  if (!response.ok) throw new Error(value.error || "Media request failed.");
  return value;
}
function uploadFile(url: string, token: string, file: File, progress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest(); xhr.open("PUT", url); xhr.timeout = 120000;
    xhr.setRequestHeader("Authorization", `Bearer ${token}`); xhr.setRequestHeader("Content-Type", file.type);
    xhr.upload.onprogress = event => { if (event.lengthComputable) progress(Math.round(event.loaded/event.total*100)); };
    xhr.onload = () => { if (xhr.status >= 200 && xhr.status < 300) resolve(); else {
      let message = "Upload failed. Refresh the library before trying again.";
      try { message = JSON.parse(xhr.responseText).error || message; } catch { /* Safe fallback. */ }
      reject(new Error(message));
    } };
    xhr.onerror = xhr.ontimeout = () => reject(new Error("Upload connection interrupted. Refresh the library; completed uploads can retry validation."));
    xhr.send(file);
  });
}
const messageOf = (error: unknown) => error instanceof Error ? error.message : "Media request failed.";
const placement = (asset: MediaAsset): MediaPlacement => ({ assetId: asset.id, width: asset.width!, height: asset.height!, alt: asset.default_alt || asset.filename.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "), decorative: false });

export default function ImageEditor({ images, onChange, disabled, onBusyChange, limit = 12, allowPath = true, siteImages = cmsSiteImages }: { images: ImageReference[]; onChange: (images: ImageReference[]) => void; disabled: boolean; onBusyChange: (busy: boolean) => void; limit?: number; allowPath?: boolean; siteImages?: readonly { label: string; source: string }[] }) {
  const uploadId = useId();
  const [assets, setAssets] = useState<MediaAsset[]>([]), [query, setQuery] = useState("");
  const [nextOffset, setNextOffset] = useState<number | null>(null), [loading, setLoading] = useState(false);
  const [error, setError] = useState(""), [notice, setNotice] = useState(""), [progress, setProgress] = useState<number | null>(null);
  const [replaceIndex, setReplaceIndex] = useState<number | null>(null), [showLocal, setShowLocal] = useState(false);
  const [address, setAddress] = useState("");
  const fileInput = useRef<HTMLInputElement>(null), active = useRef(false), requestNumber = useRef(0);
  const full = images.length >= limit;
  const load = useCallback(async (offset = 0) => {
    const number = ++requestNumber.current; setLoading(true);
    try {
      const result = await mediaRequest(undefined, `?q=${encodeURIComponent(query)}&offset=${offset}`);
      if (number === requestNumber.current) { setAssets(current => offset ? [...current, ...result.assets] : result.assets); setNextOffset(result.nextOffset); }
    } catch (error) { if (number === requestNumber.current) setError(messageOf(error)); }
    finally { if (number === requestNumber.current) setLoading(false); }
  }, [query]);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 200); return () => window.clearTimeout(timer); }, [load]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (active.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, []);
  async function upload(files: File[]) {
    if (disabled || active.current || !files.length) return;
    active.current = true; onBusyChange(true); setError("");
    try {
      for (const [index, file] of files.entries()) {
        if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > MAX_UPLOAD_BYTES || !file.size) throw new Error(`${file.name}: choose a JPEG, PNG, WebP or AVIF up to 10 MB.`);
        setNotice(`Uploading ${index+1} of ${files.length}: ${file.name}`); setProgress(0);
        const grant = await mediaRequest({ action: "grant", filename: file.name, mime: file.type, bytes: file.size });
        await uploadFile(grant.uploadUrl, grant.token, file, setProgress);
        setNotice(`Checking ${file.name} and preparing its preview…`); setProgress(null);
        await mediaRequest({ action: "validate", assetId: grant.assetId });
      }
      setNotice("Images are ready. Select them below, then save your draft.");
    } catch (error) { setError(messageOf(error)); setNotice(""); }
    finally { active.current = false; onBusyChange(false); setProgress(null); if (fileInput.current) fileInput.current.value = ""; await load(); }
  }
  async function retry(asset: MediaAsset) {
    if (disabled || active.current) return;
    active.current = true; onBusyChange(true); setError(""); setNotice(`Checking ${asset.filename}…`);
    try { await mediaRequest({ action: "validate", assetId: asset.id }); setNotice("Image is ready to select."); }
    catch (error) { setError(messageOf(error)); setNotice(""); }
    finally { active.current = false; onBusyChange(false); await load(); }
  }
  function choose(reference: ImageReference) {
    if (disabled || (full && replaceIndex === null)) return;
    if (replaceIndex !== null) onChange(images.map((image, index) => index === replaceIndex ? reference : image));
    else onChange([...images, reference]);
    setReplaceIndex(null); setError(""); setNotice("Image selected. Save draft to keep this change.");
  }
  async function saveDetails(asset: MediaAsset) {
    if (disabled || active.current) return;
    active.current = true; onBusyChange(true); setError("");
    try { await mediaRequest({ action: "metadata", assetId: asset.id, alt: asset.default_alt, archived: false }); setNotice("Library description saved. Existing page descriptions are unchanged."); }
    catch (error) { setError(messageOf(error)); }
    finally { active.current = false; onBusyChange(false); }
  }
  function move(index: number, step: number) { const next = [...images]; [next[index], next[index+step]] = [next[index+step], next[index]]; onChange(next); }
  function edit(index: number, changes: Partial<MediaPlacement>) { onChange(images.map((image, at) => at === index && typeof image !== "string" ? { ...image, ...changes } : image)); }
  return <div>
    <div className={styles.sectionIntro}><h3>Your media library</h3><p>Upload once, then reuse an image. Select a photo and save your draft.</p></div>
    <div className={css.uploadBox}>
      <label htmlFor={uploadId}><strong>Upload images</strong><span>JPEG, PNG, WebP or AVIF · up to 10 MB each</span></label>
      <input id={uploadId} ref={fileInput} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={disabled} onChange={event => void upload(Array.from(event.target.files ?? []).slice(0,12))} />
      <small>Still images up to 24 megapixels and 8192 pixels per side. Uploads stay private until published.</small>
      {progress !== null && <progress aria-label="Image upload progress" max={100} value={progress} />}
    </div>
    {error && <p className={css.referenceWarning} role="alert">{error}</p>}
    {notice && <p className={css.mediaNotice} role="status">{notice}</p>}
    <div className={css.imageSummary}><h4>Selected images <span>{images.length} / {limit}</span></h4></div>
    <ol className={css.imageList}>{images.map((reference,index) => <li key={index}>
      <div className={css.imageCard}><div className={css.thumbnail}><CmsImage reference={reference} sizes="100px" thumbnail preview /></div><div className={css.imageFields}>
        {typeof reference === "string" ? <><label className={css.imageLabel}>Existing image address<Input value={reference} disabled={disabled || !allowPath} maxLength={2048} onChange={event => onChange(images.map((image,at) => at === index ? event.target.value : image))} /></label><small className={css.help}>Existing site photo. You can replace it with a library image.</small></> : <>
          <label className={css.imageLabel}>Image {index+1} description<Input aria-label={`Image ${index+1} description`} value={reference.alt} maxLength={500} disabled={disabled || reference.decorative} placeholder="Describe what this image adds to the page" onChange={event => edit(index,{alt:event.target.value})} /></label>
          <label className={css.checkLabel}><input type="checkbox" checked={reference.decorative} disabled={disabled} onChange={event => edit(index,{decorative:event.target.checked,alt:""})} /> Decorative image (no description needed)</label>
          <small className={css.help}>{reference.width} × {reference.height} px</small>
        </>}
        <div className={css.imageActions}>
          <button type="button" disabled={disabled || index===0} onClick={() => move(index,-1)} aria-label={`Move image ${index+1} earlier`}>↑ Earlier</button>
          <button type="button" disabled={disabled || index===images.length-1} onClick={() => move(index,1)} aria-label={`Move image ${index+1} later`}>↓ Later</button>
          <button type="button" disabled={disabled} onClick={() => { setReplaceIndex(index); setNotice(`Choose a library image to replace image ${index+1}.`); }}>Replace</button>
          <button type="button" className={css.remove} disabled={disabled} onClick={() => { onChange(images.filter((_,at) => at!==index)); setReplaceIndex(null); }}>Remove</button>
        </div>
      </div></div>
    </li>)}</ol>
    {!images.length && <p className={css.noImages}>No images selected. Upload or choose an image below.</p>}
    {replaceIndex !== null && <p className={css.mediaNotice}>Replacing image {replaceIndex+1}. <button type="button" onClick={() => setReplaceIndex(null)}>Cancel</button></p>}
    <div className={css.libraryHeading}><h4>Uploaded images</h4><Button type="button" className={styles.textButton} disabled={disabled || loading} onClick={() => { setError(""); void load(); }}>Refresh library</Button></div>
    <label className={styles.field}><span>Find an image</span><Input type="search" value={query} disabled={disabled} placeholder="Search filenames or descriptions" onChange={event => setQuery(event.target.value)} /></label>
    <div className={css.library} aria-label="Uploaded media" aria-busy={loading}>{assets.map(asset => <div className={css.assetCard} key={asset.id}>
      <button type="button" disabled={disabled || asset.status!=="ready" || (full && replaceIndex===null)} onClick={() => choose(placement(asset))} aria-label={`Select ${asset.filename}`}>
        <span className={css.libraryThumb}>{asset.status === "ready" ? <CmsImage reference={placement(asset)} sizes="180px" thumbnail preview /> : <span className={css.assetPending}>{asset.status === "failed" ? "Needs attention" : "Processing"}</span>}</span>
        <span>{asset.filename}</span>
      </button>
      <small>{asset.width ? `${asset.width} × ${asset.height} · ` : ""}{(asset.original_bytes/1024/1024).toFixed(2)} MB</small>
      <small>{asset.used_by ? `Retained by ${asset.used_by} published revision${asset.used_by===1?"":"s"}` : "Not published yet"}</small>
      {asset.status === "ready" && <details className={css.assetDetails}><summary>Image details</summary><label className={css.imageLabel}>Default description<Input value={asset.default_alt} maxLength={500} disabled={disabled} onChange={event => setAssets(current => current.map(item => item.id === asset.id ? { ...item, default_alt: event.target.value } : item))} /></label><small>Used when selecting this image next time.</small><button type="button" className={css.retry} disabled={disabled} onClick={() => void saveDetails(asset)}>Save description</button></details>}
      {asset.error && <small className={css.referenceWarning}>{asset.error}</small>}
      {["uploaded","validating"].includes(asset.status) && <button type="button" className={css.retry} disabled={disabled} onClick={() => void retry(asset)}>Retry validation</button>}
      {["pending","uploading"].includes(asset.status) && <small>Refresh after upload. If interrupted, select the file again.</small>}
    </div>)}</div>
    {!assets.length && !loading && <p className={css.help}>{query ? "No matching images." : "Your uploaded images will appear here."}</p>}
    {nextOffset !== null && <Button type="button" className={styles.secondaryButton} disabled={disabled || loading} onClick={() => void load(nextOffset)}>Load more images</Button>}
    <div className={css.addImage}><Button type="button" className={styles.textButton} disabled={disabled} onClick={() => setShowLocal(!showLocal)}>{showLocal ? "Hide existing site images" : "Choose an existing site image"}</Button>
      {showLocal && <><div className={css.library}>{siteImages.map(image => <button type="button" key={image.source} disabled={disabled || (full && replaceIndex===null)} onClick={() => choose(image.source)}><span className={css.libraryThumb}><CmsImage reference={image.source} sizes="180px" thumbnail /></span><span>{image.label}</span></button>)}</div>
      {allowPath && <><label className={styles.field}><span>Existing local image path</span><Input value={address} disabled={disabled} placeholder="/images/photo.webp" onChange={event => setAddress(event.target.value)} /></label>
      <Button type="button" className={styles.secondaryButton} disabled={disabled || !address || (full && replaceIndex===null)} onClick={() => {
        if (!address.startsWith("/") || !cmsImageSource(address)) { setError("Choose an existing /images/ or /template-2/ path."); return; } choose(address.trim()); setAddress("");
      }}>Select existing image</Button></>}</>}
    </div>
    <p className={css.help}>Removing or replacing an image changes this draft only. Original files and images used by published revisions are retained.</p>
  </div>;
}
