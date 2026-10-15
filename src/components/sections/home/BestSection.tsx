import { contentDefinitions, contentText as t, type ContentRecord } from "../../../../cms/shared/content";
export default function BestSection({ content: c = contentDefinitions["why-choose-breeze"].seed.content }: { content?: ContentRecord }) {
  return (
    <section className="section best" id="why-breeze" aria-labelledby="best-title">
      <div className="wrap best-grid">
        <div className="best-copy"><h2 id="best-title">{t(c, "bestHeading")}</h2><p>{t(c, "bestBody")}</p><div className="best-pill">{t(c, "value1")} <span>✳</span> {t(c, "value2")} <span>✳</span> {t(c, "value3")}</div></div>
        <div className="best-image"><img src="/template-2/repair-technician.jpg" alt="HVAC repair technician inspecting home equipment" loading="lazy" width="1300" height="867" /><div className="image-caption">{t(c, "caption")}</div></div>
      </div>
    </section>
  );
}
