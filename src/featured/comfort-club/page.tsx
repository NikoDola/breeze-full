import type { Metadata } from "next";
import ServicePage from "@/components/sections/ServicePage";
import { serviceBySlug } from "@/lib/services";

const service = serviceBySlug("comfort-club")!;

export const metadata: Metadata = {
  title: "Comfort club",
  description: "Made in the Shade with Breeze's Comfort Club — Breeze Heating & Cooling, Middle Tennessee.",
};

export default function Page() {
  return <ServicePage service={service} />;
}
