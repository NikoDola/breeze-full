import type { Document } from "../../../cms/shared/contract";
import { safeRoute } from "../../../cms/shared/contract";
// Same renderer for preview and public content. Text only; no arbitrary HTML or styles.
export default function CmsProofContent({ document }: { document: Document }) {
  const section = document.section;
  return <section className="inner-hero">
    <div className="inner-hero-shade" />
    <div className="wrap inner-hero-content">
      {section.eyebrow && <p className="inner-hero-eyebrow">{section.eyebrow}</p>}
      <h1>{section.headline}</h1>
      {section.body && <p className="inner-hero-tagline" style={{ whiteSpace: "pre-line" }}>{section.body}</p>}
      {section.button_text && section.button_route && safeRoute(section.button_route) && <p style={{ marginTop: 24 }}><a className="service-page-button-2" href={section.button_route}>{section.button_text}</a></p>}
      {section.bottom_note && <p className="inner-hero-tagline">{section.bottom_note}</p>}
    </div>
  </section>;
}
