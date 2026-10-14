import Header from "@/components/sections/SiteHeader";
import Footer from "@/components/sections/SiteFooter";
import SiteProvider from "@/components/sections/SiteContext";
import { getSite } from "@/lib/cms/site";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  return <SiteProvider value={site}><Header /><main id="main">{children}</main><Footer /></SiteProvider>;
}
