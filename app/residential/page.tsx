import type { Metadata } from "next";
import ServicePage from "@/components/ServicePage";
import { serviceBySlug } from "@/lib/services";

const service = serviceBySlug("residential")!;

export const metadata: Metadata = {
  title: "Residential",
  description: "The Answer to Your Perfect Home Climate — Breeze Heating & Cooling, Middle Tennessee.",
};

export default function Page() {
  return <ServicePage service={service} />;
}
