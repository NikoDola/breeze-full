import type { SectionSchema } from "./home";
import { HEADING_MAX_LENGTH, validateRichText, type RichText } from "./rich-text";

// Read-only compatibility for earlier saved hero sections; never expose split controls.
export type LegacyHeroContent = {
  headingLine1: string;
  headingAccent: string;
  headingLine2: string;
  headingLine3: string;
  intro: string;
  googleRating: string;
  googleReviewCount: string;
  buttonText: string;
  phoneButtonText: string;
};
export type HeroContent = Omit<LegacyHeroContent, "headingLine1" | "headingAccent" | "headingLine2" | "headingLine3"> & { heading: RichText };

export function editableHero(content: HeroContent | LegacyHeroContent): HeroContent {
  if ("heading" in content) return content;
  const { headingLine1, headingAccent, headingLine2, headingLine3, ...rest } = content;
  return { heading: validateRichText({ version: 1, content: [
    { type: "text", text: headingLine1 }, { type: "break" },
    { type: "text", text: headingAccent, color: "accent" }, { type: "text", text: ` ${headingLine2}` }, { type: "break" },
    { type: "text", text: headingLine3 }, { type: "text", text: ".", color: "accent" },
  ] }), ...rest };
}

export const homeHeroSeed: HeroContent = {
  heading: { version: 1, content: [
    { type: "text", text: "Home feels" }, { type: "break" },
    { type: "text", text: "better", color: "accent" }, { type: "text", text: " with a" }, { type: "break" },
    { type: "text", text: "little Breeze" }, { type: "text", text: ".", color: "accent" },
  ] },
  intro: "Trusted by your neighbors.\nYour comfort is in good hands.",
  googleRating: "5.0",
  googleReviewCount: "167",
  buttonText: "Let's get comfortable",
  phoneButtonText: "Call",
};

export const legacyHomeHeroSchema: SectionSchema = {
  type: "breeze.hero", version: 1, label: "Hero",
  help: "Edit the headline, introduction, Google figures and button labels. The hero image stays fixed.",
  fields: {
    headingLine1: { kind: "text", label: "Heading — first line", max: 80 },
    headingAccent: { kind: "text", label: "Heading — highlighted word", max: 40 },
    headingLine2: { kind: "text", label: "Heading — rest of second line", max: 80 },
    headingLine3: { kind: "text", label: "Heading — third line", max: 80, help: "The orange full stop is added automatically." },
    intro: { kind: "text", label: "Introduction", max: 300, multiline: true, help: "Line breaks appear on the website." },
    googleRating: { kind: "text", label: "Google rating", max: 3, format: "google-rating", help: "Enter the current rating from 0 to 5, for example 4.9. Update this manually from Google." },
    googleReviewCount: { kind: "text", label: "Google review count", max: 7, format: "review-count", help: "Enter the current total as a whole number, for example 180. This does not sync automatically." },
    buttonText: { kind: "text", label: "Service request button text", max: 60 },
    phoneButtonText: { kind: "text", label: "Call button text", max: 40, help: "The phone number is added from Global settings." },
  },
};

// Mandatory CMS rule: one heading, one color-enabled editor; no split line/accent inputs.
export const homeHeroSchema: SectionSchema = {
  ...legacyHomeHeroSchema, version: 2,
  fields: {
    heading: { kind: "rich-text", label: "Heading", max: HEADING_MAX_LENGTH,
      help: "Edit the whole heading here. Select words to apply Default or Orange. Enter adds a line break." },
    ...Object.fromEntries(Object.entries(legacyHomeHeroSchema.fields).filter(([key]) => !key.startsWith("heading"))),
  },
};
