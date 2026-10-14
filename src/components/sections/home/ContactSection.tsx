import ServiceRequestForm from "@/components/sections/ServiceRequestForm";
import Icon from "@/components/ui/Icon";
import { site as defaultSite, type SiteData } from "@/lib/site";
import { homeSeed } from "../../../../cms/shared/home-seed";
import type { ContactContent } from "../../../../cms/shared/home";
import RichTextContent from "@/components/ui/RichTextContent";

export default function ContactSection({ content = homeSeed.slots.contact.content, site = defaultSite }: { content?: ContactContent; site?: SiteData }) {
  return (
    <section className="section contact" id="contact" aria-labelledby="contact-title"><div className="wrap contact-grid">
      <div className="contact-copy"><h2 id="contact-title">{"headingAccent" in content ? <>{content.heading.trimEnd() + " "}<em>{content.headingAccent}</em></> : <RichTextContent value={content.heading} />}</h2><p>{content.intro}</p><div className="contact-doodle" aria-hidden="true">☺</div><a className="contact-phone" href={site.phoneHref}><span>{content.phonePrompt}</span><strong><Icon name="phone" />{site.phone} ↗</strong></a></div>
      <ServiceRequestForm />
    </div></section>
  );
}
