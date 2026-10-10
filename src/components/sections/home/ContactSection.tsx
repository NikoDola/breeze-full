import ServiceRequestForm from "@/components/sections/ServiceRequestForm";
import { site } from "@/lib/site";

export default function ContactSection() {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title"><div className="wrap contact-grid">
      <div className="contact-copy"><h2 id="contact-title">Let&apos;s make home feel <em>just right.</em></h2><p>Tell us what you need. We&apos;ll help you take the next step.</p><div className="contact-doodle" aria-hidden="true">☺</div><a className="contact-phone" href={site.phoneHref}><span>Want to talk now?</span><strong>{site.phone} ↗</strong></a></div>
      <ServiceRequestForm />
    </div></section>
  );
}
