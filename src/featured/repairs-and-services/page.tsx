import type { Metadata } from "next";
import ServicePage from "@/components/sections/ServicePage";
import { serviceBySlug } from "@/lib/services";

const service = serviceBySlug("repairs-and-services")!;

export const metadata: Metadata = {
  title: "Repairs & Services",
  description: "Yep. We Fix It. — Breeze Heating & Cooling, Middle Tennessee.",
};

export default function Page() {
  return <ServicePage service={service} />;
}
