import Link from "next/link";

const serviceCards = [
  { title: "Heating", href: "/heating", image: "/template-2/heating.png" },
  { title: "Cooling", href: "/cooling", image: "/template-2/cooling-photo.jpg" },
  { title: "Repairs & Services", href: "/repairs-and-services", image: "/template-2/repair-technician.jpg" },
  { title: "Mini-split Systems", href: "/mini-split-systems", image: "/template-2/mini-split-photo.jpg" },
  { title: "Water heater solutions", href: "/water-heater-solutions", image: "/images/Guy-water-heating-solution-full.jpg" },
  { title: "Indoor quality", href: "/indoor-quality", image: "/images/Indoor-quality.png" },
];

export default function ServicesSection() {
  return (
    <section className="section services" id="services" aria-labelledby="services-title">
      <div className="wrap">
        <div className="section-heading services-heading"><div><h2 id="services-title">Professional<br /><em>HVAC Services</em></h2></div><p>All the ways we keep your home feeling just right, in one happy place.</p></div>
        <div className="service-grid">
          {serviceCards.map((card) => <Link className="service-card" href={card.href} key={card.href}><span className="service-image"><img src={card.image} alt="" loading="lazy" /></span><span className="service-name">{card.title}</span><span className="service-arrow" aria-hidden="true">↗</span></Link>)}
        </div>
      </div>
    </section>
  );
}
