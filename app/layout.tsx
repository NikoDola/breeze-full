import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";
import { site } from "@/lib/site";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.breezehc.com"),
  title: {
    default: `${site.name} — Heating & Cooling | Nashville, TN`,
    template: `%s | ${site.name}`,
  },
  description:
    "1st Class Service With A Smile. Family owned and operated heating, cooling, and indoor air quality experts serving Nashville, Brentwood and Middle Tennessee for more than two decades.",
  keywords: [
    "HVAC Nashville",
    "heating and cooling Middle Tennessee",
    "AC repair Nashville",
    "furnace repair",
    "mini-split systems",
    "Breeze Heating and Cooling",
  ],
  openGraph: {
    title: `${site.fullName} — 1st Class Service With A Smile`,
    description:
      "Family owned HVAC service for Nashville and Middle Tennessee. Heating, cooling, repairs, indoor air quality and 24/7 emergency service.",
    type: "website",
    locale: "en_US",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={geist.variable} data-scroll-behavior="smooth">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
