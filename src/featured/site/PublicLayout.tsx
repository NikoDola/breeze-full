import Header from "@/components/sections/SiteHeader";
import Footer from "@/components/sections/SiteFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <><Header /><main id="main">{children}</main><Footer /></>;
}
