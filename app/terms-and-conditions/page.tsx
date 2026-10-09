import type { Metadata } from "next";
import LegalPage from "@/components/LegalPage";
import { termsSections } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "The terms governing your use of the Breeze Heating and Cooling website and services.",
};

export default function Page() {
  return (
    <LegalPage
      title="Terms and Conditions"
      effectiveLabel="Last updated: 2025"
      sections={termsSections}
    />
  );
}
