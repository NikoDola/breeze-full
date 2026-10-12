import ServiceRequestForm from "@/components/sections/ServiceRequestForm";
import Icon from "@/components/ui/Icon";
import { site } from "@/lib/site";
import { homeSeed } from "../../../../cms/shared/home-seed";
import type { ContactContent } from "../../../../cms/shared/home";

export default function ContactSection({ content = homeSeed.slots.contact.content }: { content?: ContactContent }) {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title"><div className="wrap contact-grid">
      <div className="contact-copy"><h2 id="contact-title">{content.heading.trimEnd() + " "}<em>{content.headingAccent}</em></h2><p>{content.intro}</p><div className="contact-doodle" aria-hidden="true">☺</div><a className="contact-phone" href={site.phoneHref}><span>{content.phonePrompt}</span><strong><Icon name="phone" />{site.phone} ↗</strong></a></div>
      <ServiceRequestForm />
    </div></section>
  );
}
