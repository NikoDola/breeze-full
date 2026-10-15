import { contentDefinitions, contentText as t, type ContentRecord } from "../../../../cms/shared/content";
import type { ServiceSummary } from "../ContentPageView";
import Link from "next/link";

const serviceCards = [
  { title: "Heating", href: "/heating", image: "/template-2/heating.png" },
  { title: "Cooling", href: "/cooling", image: "/template-2/cooling-photo.jpg" },
  { title: "Repairs & Services", href: "/repairs-and-services", image: "/images/repairs-service-technician-v2.webp" },
  { title: "Mini-split Systems", href: "/mini-split-systems", image: "/template-2/mini-split-photo.jpg" },
  { title: "Water heater solutions", href: "/water-heater-solutions", image: "/images/Guy-water-heating-solution-full.jpg" },
  { title: "Indoor quality", href: "/indoor-quality", image: "/images/Indoor-quality.png" },
];

export default function ServicesSection({ content: c = contentDefinitions["why-choose-breeze"].seed.content, services = [] }: { content?: ContentRecord; services?: ServiceSummary[] }) {
  const cards = serviceCards.map(card => ({ ...card, title: services.find(service => "/" + service.slug === card.href)?.title ?? card.title }));
  return (
    <section className="section services" id="services" aria-labelledby="services-title">
      <div className="wrap">
        <div className="section-heading services-heading"><div><h2 id="services-title">{t(c, "servicesHeading")}<br /><em>{t(c, "servicesAccent")}</em></h2></div><p>{t(c, "servicesIntro")}</p></div>
        <div className="service-grid">
          {cards.map((card) => <Link className="service-card" href={card.href} key={card.href}><span className="service-image"><img src={card.image} alt="" loading="lazy" /></span><span className="service-name">{card.title}</span><span className="service-arrow" aria-hidden="true">↗</span></Link>)}
        </div>
      </div>
    </section>
  );
}
