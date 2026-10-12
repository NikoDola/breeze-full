import type { Document } from "../../../cms/shared/contract";
import { safeRoute } from "../../../cms/shared/contract";
import CmsSectionImages from "./CmsSectionImages";
import styles from "./cms-proof.module.css";
// Shared by the live editor and published proof. Only validated text and image references.
export default function CmsProofContent({ document, preview = false }: { document: Document; preview?: boolean }) {
  const section = document.section;
  const Heading = preview ? "h3" : "h1";
  const showButton = section.button_text && section.button_route && safeRoute(section.button_route);
  return <section className={styles.section}>
    <div className="inner-hero-shade" />
    <div className={styles.content}>
      {section.eyebrow && <p className={styles.eyebrow}>{section.eyebrow}</p>}
      <Heading className={styles.headline}>{section.headline || (preview ? "Your headline goes here" : "")}</Heading>
      {section.body && <p className={styles.body}>{section.body}</p>}
      {showButton && <p className={styles.cta}>{preview ? <span className={styles.button}>{section.button_text}</span> : <a className={styles.button} href={section.button_route}>{section.button_text}</a>}</p>}
      {section.bottom_note && <p className={styles.note}>{section.bottom_note}</p>}
      <CmsSectionImages images={section.images} />
    </div>
  </section>;
}
