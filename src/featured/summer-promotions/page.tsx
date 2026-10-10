import type { Metadata } from "next";
import PromoPage from "@/components/sections/PromoPage";
import { getPromo } from "@/lib/promotions";

const promo = getPromo("summer-promotions");

export const metadata: Metadata = {
  title: promo.title,
  description: promo.metaDescription,
};

export default function Page() {
  return <PromoPage {...promo} />;
}
