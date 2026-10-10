import type { Metadata } from "next";
import ServicePage from "@/components/sections/ServicePage";
import { serviceBySlug } from "@/lib/services";

const service = serviceBySlug("water-heater-solutions")!;

export const metadata: Metadata = {
  title: "Water heater solutions",
  description: "Water Heater Solutions — Breeze Heating & Cooling, Middle Tennessee.",
};

export default function Page() {
  return <ServicePage service={service} />;
}
