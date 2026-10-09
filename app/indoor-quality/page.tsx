import type { Metadata } from "next";
import ServicePage from "@/components/ServicePage";
import { serviceBySlug } from "@/lib/services";

const service = serviceBySlug("indoor-quality")!;

export const metadata: Metadata = {
  title: "Indoor quality",
  description: "Breathe Easy with IAQ Innovation — Breeze Heating & Cooling, Middle Tennessee.",
};

export default function Page() {
  return <ServicePage service={service} />;
}
