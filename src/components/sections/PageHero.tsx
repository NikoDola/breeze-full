import Link from "next/link";
import Icon from "@/components/ui/Icon";

export default function TemplatePageHero({ title, tagline, eyebrow, icon, image }: {
  title: string;
  tagline?: string;
  eyebrow?: string;
  icon?: string;
  image?: string;
}) {
  return <section className="inner-hero" aria-labelledby="inner-hero-title">
    {image && <div className="inner-hero-photo" style={{ backgroundImage: `url(${image})` }} />}
    <div className="inner-hero-shade" />
    <div className="wrap inner-hero-content">
      <nav className="inner-breadcrumb" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>{title}</span></nav>
      <div className="inner-hero-heading">
        {icon && <span className="inner-hero-icon"><Icon name={icon} className="inner-hero-svg" /></span>}
        <div>
          {eyebrow && <p className="inner-hero-eyebrow">{eyebrow}</p>}
          <h1 id="inner-hero-title">{title}<span className="period">.</span></h1>
          {tagline && <p className="inner-hero-tagline">{tagline}</p>}
        </div>
      </div>
    </div>
  </section>;
}
