import { Fragment } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import PublicEmail from "@/components/ui/PublicEmail";
import PageHero from "./PageHero";
import CtaBandContent from "./CtaBandContent";
import CareersContent from "./CareersContent";
import PromotionsContent from "./PromotionsContent";
import AboutContent from "./AboutContent";
import WhyContent from "./WhyContent";
import ContactContent from "./ContactContent";
import EmergencyContent from "./EmergencyContent";
import ServicesContent from "./ServicesContent";
import LegalContent from "./LegalContent";
import GalleryContent from "./GalleryContent";
import ServiceNavigation from "./ServiceNavigation";
import { contentDefinitions, contentText as t, contentItems as items, type ContentDocument } from "../../../cms/shared/content";
import type { SiteData } from "@/lib/site";
import navigation from "./service-navigation.module.css";

export type ServiceSummary = { slug: string; title: string; icon: string; image: string; tagline: string; blurb: string; revisionId?: string; version?: number };
export default function ContentPageView({ document, site, services = [], offerSlug, preview, mediaOrigin }: { document: ContentDocument; site: SiteData; services?: ServiceSummary[]; offerSlug?: string; preview?: boolean; mediaOrigin?: string }) {
  const definition = contentDefinitions[document.pageId], c = document.content;
  if (definition.family === "promotions") return <PromotionsContent document={document} site={site} offerSlug={offerSlug} />;
  if (definition.family === "about") return <AboutContent content={c} site={site} />;
  if (definition.family === "why") return <WhyContent content={c} site={site} services={services} />;
  if (definition.family === "contact") return <ContactContent content={c} site={site} />;
  if (definition.family === "emergency") return <EmergencyContent content={c} site={site} />;
  if (definition.family === "services") return <ServicesContent content={c} site={site} services={services} />;
  if (definition.family === "gallery") return <GalleryContent content={c} site={site} preview={preview} mediaOrigin={mediaOrigin} />;
  if (definition.family === "legal") return <LegalContent site={site} title={t(c, "heading")} effectiveLabel={t(c, "effectiveLabel")} intro={t(c, "intro")} sections={items(c, "sections").map(section => ({ heading: t(section, "heading"), paragraphs: t(section, "paragraphs") ? t(section, "paragraphs").split("\n\n") : undefined, items: t(section, "items") ? t(section, "items").split("\n").filter(Boolean) : undefined }))} />;
  function contactText(text: string) {
    const parts = text.replaceAll("{phone}", site.phone).split("{email}");
    return parts.length === 1 ? parts[0] : parts.map((part, index) => <Fragment key={index}>{index > 0 && <PublicEmail email={site.email} href={site.emailHref} />}{part}</Fragment>);
  }
  const related = document.pageId === "going-green" ? ["energy-audits", "why-choose-breeze", "meet-the-hvac-experts", "contact-us"] : ["why-choose-breeze", "going-green", "careers", "contact-us"];
  const relatedLabels: Record<string, string> = { "energy-audits": "Energy audits", "why-choose-breeze": "Why Choose Breeze", "meet-the-hvac-experts": "Meet the HVAC experts", "going-green": "Going green", careers: "Careers", "contact-us": "Contact us" };
  return <>
    <PageHero title={t(c, "heading")} eyebrow={t(c, "eyebrow")} tagline={t(c, "tagline")} icon={definition.icon} image={definition.image} parallax={definition.family === "article"} />
    {definition.family === "careers" ? <CareersContent content={c} /> : <section className="service-page-section-1"><div className="service-page-layout-1">
      <div className="service-page-block-1">{items(c, "blocks").map(block => {
        const key = t(block, "id"), text = t(block, "text");
        return block.type === "heading" ? <h3 key={key}>{contactText(text)}</h3> : block.type === "list" ? <ul key={key}>{text.split("\n").filter(value => value.trim()).map((value, index) => <li key={index}>{contactText(value)}</li>)}</ul> : <p key={key}>{contactText(text)}</p>;
      })}</div>
      {c.calloutHeading && <div className="experts-content-card-2"><span className="experts-content-badge-1"><Icon name="check" className="experts-content-icon-1" /></span><h3 className="experts-content-heading-3">{t(c, "calloutHeading")}</h3>{t(c, "calloutBody").split("\n\n").map((text, index) => <p key={index}>{contactText(text)}</p>)}</div>}
      {c.schedule && <div className="service-page-callouts">
        <div className="service-page-card-2"><div className="service-page-layout-2"><span className="service-page-badge-1"><Icon name="calendar" className="service-page-icon-1" /></span><div>
          <h3 className="service-page-heading-1">{site.sharedCopy.service.scheduleHeading}</h3><p className="service-page-copy-1">{contactText(t(c, "schedule"))}</p>
          <div className="service-page-layout-3"><a href={site.phoneHref} className="service-page-button-1"><Icon name="phone" className="service-page-icon-2" />{site.phone}</a><Link href="/contact-us" className="service-page-button-2">{site.sharedCopy.service.requestLabel}</Link></div>
        </div></div></div>
        <div className="service-page-card-3"><span className="service-page-badge-3"><Icon name="bolt" className="service-page-icon-4" /></span><h3 className="service-page-heading-3">{site.sharedCopy.service.emergencyHeading}</h3><p className="service-page-copy-2">{site.sharedCopy.service.emergencyBody}</p><Link href="/emergency" className="service-page-link-2">{site.sharedCopy.service.emergencyLinkLabel}<Icon name="arrow" className="service-page-icon-5" /></Link></div>
      </div>}
      {definition.group === "HVAC" ? <ServiceNavigation services={services.filter(service => service.slug !== document.pageId)} /> : <aside className={navigation.navigation}><div className={navigation.panel}><h2>Keep reading</h2><nav className={navigation.articleLinks} aria-label="Related pages">{related.map(id => <Link href={`/${id}`} key={id} className={navigation.link}><span className={navigation.icon}><Icon name="arrow" /></span><span>{relatedLabels[id]}</span></Link>)}</nav></div></aside>}
    </div></section>}
    <CtaBandContent site={site} />
  </>;
}
