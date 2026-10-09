import type { Metadata } from "next";
import ServicePage from "@/components/ServicePage";
import { serviceBySlug } from "@/lib/services";

const service = serviceBySlug("commercial-industrial")!;

export const metadata: Metadata = {
  title: "Commercial & Industrial",
  description: "Commercial & Industrial Services in Middle Tennessee — Breeze Heating & Cooling, Middle Tennessee.",
};

export default function Page() {
  return <ServicePage service={service} />;
}
