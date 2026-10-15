import Icon from "@/components/ui/Icon";
import type { SiteData } from "@/lib/site";
import "@/styles/interior-page.css";

export default function ContactLocation({ site }: { site: SiteData }) {
  return <div className="contact-us-card-1">
    <iframe title={`Map to ${site.addressLine}`} src={site.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="contact-us-iframe-1" />
    <a href={site.mapsHref} target="_blank" rel="noreferrer" className="contact-us-button-2"><span className="contact-us-text-5">Get directions</span><Icon name="arrow" className="contact-us-icon-2" /></a>
  </div>;
}
