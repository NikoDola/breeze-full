import type { Metadata } from "next";
import ServicePage from "@/components/ServicePage";
import { serviceBySlug } from "@/lib/services";

const service = serviceBySlug("mini-split-systems")!;

export const metadata: Metadata = {
  title: "Mini-split systems",
  description: "Safeguarding Your Comfort with Mini-Split Systems — Breeze Heating & Cooling, Middle Tennessee.",
};

export default function Page() {
  return <ServicePage service={service} />;
}
