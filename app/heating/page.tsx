import type { Metadata } from "next";
import ServicePage from "@/components/ServicePage";
import { serviceBySlug } from "@/lib/services";

const service = serviceBySlug("heating")!;

export const metadata: Metadata = {
  title: "Heating",
  description: "Keeping you warm and oh-so-cozy — Breeze Heating & Cooling, Middle Tennessee.",
};

export default function Page() {
  return <ServicePage service={service} />;
}
