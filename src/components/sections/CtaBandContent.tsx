import Link from "next/link";
import type { SiteData } from "@/lib/site";

export default function CtaBandContent({ site }: { site: SiteData }) {
  const text = site.sharedCopy.cta;
  return <section className="inner-cta"><div className="wrap inner-cta-grid">
    <div><p className="inner-kicker">{text.kicker}</p><h2>{text.heading} <em>{text.accent}</em></h2><p>{text.body}</p></div>
    <div className="inner-cta-actions"><Link className="button orange" href="/contact-us#service-form">{text.buttonLabel} <span aria-hidden="true">↗</span></Link><a className="button ghost" href={site.phoneHref}>{text.phoneLabel} {site.phone}</a></div>
  </div></section>;
}
