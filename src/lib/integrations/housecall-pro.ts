export const HOUSECALL_PRO_FORM_URL = "https://book.housecallpro.com/lead-form/Breeze-Heating-and-Cooling-LLC/c370368da67f40d6a0b374639708649e";

export function housecallHeight(value: unknown): number | null {
  if (typeof value !== "number" && (typeof value !== "string" || !/^\d+(\.\d+)?(px)?$/.test(value))) return null;
  const height = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(height) && height >= 100 && height <= 12000 ? Math.ceil(height) : null;
}

export function housecallRedirect(value: unknown, origin: string): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value, origin);
    if (url.username || url.password) return null;
    const hosts = ["breezehc.com", "www.breezehc.com", "book.housecallpro.com", "online-booking.housecallpro.com"];
    if (url.origin === origin || (url.protocol === "https:" && !url.port && hosts.includes(url.hostname))) return url.href;
  } catch { /* Ignore malformed vendor messages. */ }
  return null;
}
