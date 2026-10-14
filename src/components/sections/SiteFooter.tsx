import Link from "next/link";
import { getSite } from "@/lib/cms/site";
import { getPublishedGlobal } from "@/lib/cms/public";
import Icon from "@/components/ui/Icon";
import PublicEmail from "@/components/ui/PublicEmail";

const footerLinks = [
  ["HVAC", "/services"], ["Promotions", "/promotions"],
  ["Emergency", "/emergency"], ["Client", "/reviews"],
  ["About us", "/about-us"], ["Gallery", "/gallery"],
] as const;

export default async function TemplateFooter() {
  const [site, publication] = await Promise.all([getSite(), getPublishedGlobal()]);
  return <footer className="site-footer" data-cms-page={publication ? "global" : undefined} data-cms-revision={publication?.revisionId} data-cms-version={publication?.version}>
    <div className="wrap footer-main">
      <div>
        <Link href="/" aria-label="Breeze home"><img src="/template-2/breeze-logo-light.svg" alt="Breeze Heating & Cooling" width="211" height="41" /></Link>
        <p>1st Class Service With A Smile.</p>
      </div>
      <div className="footer-links">
        {footerLinks.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}
      </div>
      <div className="footer-reach">
        <span>NASHVILLE, TN &amp; BEYOND</span>
        <a href={site.phoneHref}>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1C10.61 21 3 13.39 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.46.57 3.58a1 1 0 0 1-.25 1.01z" /></svg>
          {site.phone}
        </a>
        <PublicEmail className="footer-email" email={site.email} href={site.emailHref} />
        {site.socials.length > 0 && <nav className="footer-socials" aria-label="Social media">{site.socials.map(link => <a key={link.platform} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={`Breeze on ${link.label} (opens in a new tab)`}><Icon name="link" />{link.label}</a>)}</nav>}
      </div>
    </div>
    <div className="wrap footer-bottom">
      <span>© {new Date().getFullYear()} Breeze Heating &amp; Cooling</span>
      <div><Link href="/privacy-policy">Privacy Policy</Link><Link href="/terms-and-conditions">Terms &amp; Conditions</Link></div>
    </div>
  </footer>;
}
