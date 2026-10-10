import Link from "next/link";
import { site } from "@/lib/site";

export default function TemplateCtaBand() {
  return <section className="inner-cta">
    <div className="wrap inner-cta-grid">
      <div><p className="inner-kicker">A LITTLE BREEZE GOES A LONG WAY</p><h2>Let&apos;s make home feel <em>just right.</em></h2><p>Speak with a real person 24/7. We&apos;ll help you find the next step for your home or business.</p></div>
      <div className="inner-cta-actions"><Link className="button orange" href="/contact-us#service-form">Request service <span aria-hidden="true">↗</span></Link><a className="button ghost" href={site.phoneHref}>Call {site.phone}</a></div>
    </div>
  </section>;
}
