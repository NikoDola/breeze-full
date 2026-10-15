import { exactKeys, record, text } from "./validation";
export const defaultSharedCopy = {
  cta: { kicker: "A LITTLE BREEZE GOES A LONG WAY", heading: "Let's make home feel", accent: "just right.", body: "Speak with a real person 24/7. We'll help you find the next step for your home or business.", buttonLabel: "Request service", phoneLabel: "Call" },
  service: { scheduleHeading: "Schedule it", requestLabel: "Request service", emergencyHeading: "Emergency? We never sleep.", emergencyBody: "A Breeze representative is available 24/7/365 to answer your call — a real, live person.", emergencyLinkLabel: "Emergency service" },
};
export type SharedCopy = typeof defaultSharedCopy;
export function validateSharedCopy(value: unknown): SharedCopy {
  const source = record(value);
  exactKeys(source, ["cta", "service"], "shared page text");
  return Object.fromEntries(Object.entries(defaultSharedCopy).map(([group, defaults]) => {
    const values = record(source[group]);
    exactKeys(values, Object.keys(defaults), group);
    return [group, Object.fromEntries(Object.keys(defaults).map(key => [key, text(values[key], `${group} / ${key}`, key.toLowerCase().includes("body") ? 3000 : 300, true)]))];
  })) as SharedCopy;
}
