const encoder = new TextEncoder();
async function key(secret: string) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function sign(secret: string, timestamp: string, body: string): Promise<string> {
  const bytes = await crypto.subtle.sign("HMAC", await key(secret), encoder.encode(`${timestamp}.${body}`));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, "0")).join("");
}
export async function verify(secret: string, timestamp: string, body: string, signature: string): Promise<boolean> {
  if (!/^\d{10,13}$/.test(timestamp) || Math.abs(Date.now() - Number(timestamp)) > 300000 || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const bytes = Uint8Array.from(signature.match(/../g)!, s => parseInt(s, 16));
  return crypto.subtle.verify("HMAC", await key(secret), bytes, encoder.encode(`${timestamp}.${body}`));
}
