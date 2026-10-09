import type { Metadata } from "next";
import ServicePage from "@/components/ServicePage";
import { serviceBySlug } from "@/lib/services";

const service = serviceBySlug("financing")!;

export const metadata: Metadata = {
  title: "Financing",
  description: "HVAC Financing — Breeze Heating & Cooling, Middle Tennessee.",
};

export default function Page() {
  return <ServicePage service={service} />;
}
