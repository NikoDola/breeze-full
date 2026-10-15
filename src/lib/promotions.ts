import data from "@/content/promotions.json";

// Source baseline and fixed design assets. Published promotion text comes from the CMS.

export type Promo = {
  slug: string;
  title: string;
  tagline: string;
  offer: string;
  code: string;
  image: string;
  icon: string;
  blurb: string;
  otherHref: string;
  otherLabel: string;
  metaDescription: string;
};

export const promotions = data.items as Promo[];

export function getPromo(slug: string): Promo {
  const promo = promotions.find((p) => p.slug === slug);
  if (!promo) {
    throw new Error(`Unknown promotion slug: ${slug}`);
  }
  return promo;
}
