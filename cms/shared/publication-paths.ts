import type { PublishEvent } from "./contract";
import { serviceLabels } from "../../src/lib/service-labels";

/** Routes that must display this revision before delivery is confirmed. */
export function publicationPaths(event: PublishEvent): string[] {
  if (event.pageId === "promotions") return [event.path, "/winter-promotions", "/summer-promotions"];
  if (event.pageId === "global") return [event.path, "/contact-us", "/privacy-policy", "/terms-and-conditions"];
  if (Object.hasOwn(serviceLabels, event.pageId)) return [event.path, "/services"];
  return [event.path];
}
