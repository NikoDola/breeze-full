import Header from "@/components/sections/SiteHeader";
import Footer from "@/components/sections/SiteFooter";
import SiteProvider from "@/components/sections/SiteContext";
import { getSite } from "@/lib/cms/site";
import ClarityProvider from "@/components/analytics/ClarityProvider";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  const analyticsEnabled = process.env.VERCEL_ENV === "production" && process.env.CLARITY_ENABLED !== "false";
  return <SiteProvider value={site}><ClarityProvider enabled={analyticsEnabled}><Header /><main id="main">{children}</main><Footer /></ClarityProvider></SiteProvider>;
}
