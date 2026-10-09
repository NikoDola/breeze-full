import type { Metadata } from "next";
import ServicePage from "@/components/ServicePage";
import { serviceBySlug } from "@/lib/services";

const service = serviceBySlug("property-manager")!;

export const metadata: Metadata = {
  title: "Property manager",
  description: "Middle Tennessee Property Management Services — Breeze Heating & Cooling, Middle Tennessee.",
};

export default function Page() {
  return <ServicePage service={service} />;
}
