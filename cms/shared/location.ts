import { exactKeys, InputError, record, text } from "./validation";

export type BusinessAddress = { street: string; city: string; state: string; zip: string; country: string };
export function addressText(address: BusinessAddress) {
  return `${address.street}, ${address.city}, ${address.state} ${address.zip}`;
}
export function validateAddress(value: unknown): BusinessAddress {
  const address = record(value);
  exactKeys(address, ["street", "city", "state", "zip", "country"], "business address");
  return { street: text(address.street, "Street address", 200, true).trim(),
    city: text(address.city, "City", 100, true).trim(), state: text(address.state, "State / region", 100, true).trim(),
    zip: text(address.zip, "Postal code", 30, true).trim(), country: text(address.country, "Country", 100, true).trim() };
}
export function validateMapsLink(value: unknown) {
  const href = text(value, "Google Maps directions link", 2048, true);
  let url: URL;
  try { url = new URL(href); } catch { throw new InputError("Use a full HTTPS Google Maps link."); }
  const approved = ((url.hostname === "www.google.com" || url.hostname === "google.com") && /^\/maps(?:\/|$)/.test(url.pathname)) ||
    (url.hostname === "maps.google.com" && url.pathname === "/") ||
    (url.hostname === "maps.app.goo.gl" && url.pathname !== "/");
  if (!approved || url.protocol !== "https:" || url.username || url.password || url.port || /[\s\\\u0000-\u001f\u007f]/.test(href)) throw new InputError("Use a full HTTPS Google Maps link.");
  return href;
}
export const directionsLink = (address: BusinessAddress) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressText(address))}`;
export const locationEmbed = (address: BusinessAddress) => `https://www.google.com/maps?q=${encodeURIComponent(`${addressText(address)}, ${address.country}`)}&output=embed`;
