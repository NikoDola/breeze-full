import type { Metadata } from "next";
import LegalPage from "@/components/sections/LegalPage";
import { privacyIntro, privacySections } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Breeze Heating and Cooling LLC collects, uses, and shares information when you visit our site or use our HVAC services.",
};

export default function Page() {
  return (
    <LegalPage
      title="Privacy Policy"
      effectiveLabel="Effective date: 2025"
      intro={privacyIntro}
      sections={privacySections}
    />
  );
}
