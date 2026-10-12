import type { PublishEvent } from "./contract";

export function confirmsPublication(html: string, event: PublishEvent): boolean {
  // Require all markers on the same real HTML element, including page identity.
  for (const match of html.matchAll(/<[a-z][^>]*\sdata-cms-page="([^"]+)"[^>]*>/gi)) {
    if (match[1] !== event.pageId) continue;
    const version = Number(match[0].match(/\sdata-cms-version="(\d+)"/)?.[1]);
    const id = match[0].match(/\sdata-cms-revision="([a-f0-9-]+)"/)?.[1];
    if (id && (version > event.version || (version === event.version && id === event.revisionId))) return true;
  }
  return false;
}
