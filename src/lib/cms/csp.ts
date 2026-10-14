// Report-only rollout: script nonces are limited to already-dynamic admin pages.
// Inline styles remain allowed for React layout styles and Tiptap's stylesheet.
export function adminReportPolicy(nonce: string, development: boolean, mediaOrigin?: string) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob:${mediaOrigin ? ` ${mediaOrigin}` : ""}`,
    "font-src 'self' data:",
    `connect-src 'self'${mediaOrigin ? ` ${mediaOrigin}` : ""}${development ? " ws: wss:" : ""}`,
    "frame-src 'self' https://www.google.com",
    "object-src 'none'", "base-uri 'self'", "form-action 'self'",
  ].join("; ");
}
