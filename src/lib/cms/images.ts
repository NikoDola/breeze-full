// Rendering only: the existing document continues to store image references verbatim.
export function cmsImageSource(reference: string): string | null {
  const value = reference.trim();
  if (!value || value.length > 2048 || /[\\\u0000-\u001f\u007f]/.test(value)) return null;
  if (value.startsWith("/") && !value.startsWith("//")) {
    // Only existing public asset folders enter Next's local image optimizer.
    if (!/^\/(?:images|template-2)\//.test(value) || /(?:^|\/)\.\.(?:\/|$)/.test(value) || /%(?:2f|5c|2e)/i.test(value)) return null;
    if (!/\.(?:avif|webp|png|jpe?g|gif|svg)(?:[?#]|$)/i.test(value)) return null;
    return value;
  }
  if (!value.includes("/") && /^[\w .-]+\.(?:avif|webp|png|jpe?g|gif|svg)$/i.test(value)) return `/images/${encodeURIComponent(value)}`;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export const cmsSiteImages = [
  { label: "Family comfort", source: "/template-2/family-comfort.jpg" },
  { label: "Breeze service technician", source: "/template-2/repair-technician.jpg" },
  { label: "Heating & cooling at home", source: "/template-2/hero-home.webp" },
  { label: "Cooling services", source: "/template-2/cooling-photo.jpg" },
  { label: "Mini-split system", source: "/template-2/mini-split-photo.jpg" },
  { label: "Comfortable home", source: "/images/hero-full.webp" },
] as const;
