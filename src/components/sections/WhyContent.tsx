import PageHero from "./PageHero";
import SmileSection from "./home/SmileSection";
import ServicesSection from "./home/ServicesSection";
import BestSection from "./home/BestSection";
import StorySection from "./home/StorySection";
import ExpertsContent from "./ExpertsContent";
import CtaBandContent from "./CtaBandContent";
import { contentText as t, type ContentRecord } from "../../../cms/shared/content";
import type { SiteData } from "@/lib/site";
import type { ServiceSummary } from "./ContentPageView";

export default function WhyContent({ content: c, site, services }: { content: ContentRecord; site: SiteData; services: ServiceSummary[] }) {
  return <><PageHero title={t(c, "heading")} eyebrow={t(c, "eyebrow")} tagline={t(c, "tagline")} icon="star" image="/images/Why-We-Should-At-Home.jpg" />
    <SmileSection content={c} /><ServicesSection content={c} services={services} /><BestSection content={c} /><StorySection content={c} />
    <ExpertsContent content={c} related={[{ label: "Meet the HVAC experts", href: "/meet-the-hvac-experts" }, { label: "Going green", href: "/going-green" }, { label: "About us", href: "/about-us" }, { label: "Contact us", href: "/contact-us" }]} />
    <CtaBandContent site={site} /></>;
}
