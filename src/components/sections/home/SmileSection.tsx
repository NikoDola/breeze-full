import { contentDefinitions, contentText as t, type ContentRecord } from "../../../../cms/shared/content";
import Link from "next/link";

export default function SmileSection({ content: c = contentDefinitions["why-choose-breeze"].seed.content }: { content?: ContentRecord }) {
  return (
    <section className="section smile" id="smile" aria-labelledby="smile-title">
      <div className="wrap smile-grid">
        <div className="smile-art"><img src="/template-2/family-comfort.jpg" alt="Family relaxing together at home" loading="lazy" width="1000" height="667" /><div className="smile-seal" aria-hidden="true">GOOD SERVICE<br /><strong>FEELS GOOD</strong><span>☺</span></div></div>
        <div className="smile-copy"><h2 id="smile-title">{t(c, "smileHeading")} <em>{t(c, "smileAccent")}</em></h2><p>{t(c, "smileBody")}</p><Link className="text-link" href="/about-us">{t(c, "smileLink")} <span aria-hidden="true">↗</span></Link></div>
      </div>
    </section>
  );
}
