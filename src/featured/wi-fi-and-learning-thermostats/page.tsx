import type { Metadata } from "next";
import ServicePage from "@/components/sections/ServicePage";
import { serviceBySlug } from "@/lib/services";

const service = serviceBySlug("wi-fi-and-learning-thermostats")!;

export const metadata: Metadata = {
  title: "Wi-Fi and Learning Thermostats",
  description: "Smart Control Over Every Degree — Breeze Heating & Cooling, Middle Tennessee.",
};

export default function Page() {
  return <ServicePage service={service} />;
}
