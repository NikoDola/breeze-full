import type { Metadata } from "next";
import PromoPage from "@/components/PromoPage";
import { getPromo } from "@/lib/promotions";

const promo = getPromo("winter-promotions");

export const metadata: Metadata = {
  title: promo.title,
  description: promo.metaDescription,
};

export default function Page() {
  return <PromoPage {...promo} />;
}
