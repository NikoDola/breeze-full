import { homeSeed } from "../../../../cms/shared/home-seed";
import type { SeasonsContent } from "../../../../cms/shared/home";
import RichTextContent from "@/components/ui/RichTextContent";

export default function SeasonsSection({ content = homeSeed.slots.seasons.content, publication }: {
  content?: SeasonsContent; publication?: { revisionId: string; version: number };
}) {
  return (
    <section className="section seasons" id="heating-cooling" aria-labelledby="seasons-title" data-cms-page={publication ? "home" : undefined} data-cms-revision={publication?.revisionId} data-cms-version={publication?.version}>
      <div className="wrap">
        <div className="section-heading"><div><h2 id="seasons-title">{"headingLine1" in content ? <>{content.headingLine1}<br />{content.headingLine2.trimEnd() + " "}<em>{content.headingAccent}</em></> : <RichTextContent value={content.heading} />}</h2></div><p>{content.intro}</p></div>
        <div className="season-grid">
          <article className="season-card cooling">
            <div className="season-top"><span className="season-icon" aria-hidden="true">❄</span></div>
            <h3>{content.cards[0].title}</h3><p className="season-label">{content.cards[0].label}</p>
            <p>{content.cards[0].body}</p>
            <a href="#contact" data-service="Cooling">{content.cards[0].buttonText} <span aria-hidden="true">↗</span></a>
          </article>
          <article className="season-card heating">
            <div className="season-top"><span className="season-icon" aria-hidden="true">☀</span></div>
            <h3>{content.cards[1].title}</h3><p className="season-label">{content.cards[1].label}</p>
            <p>{content.cards[1].body}</p>
            <a href="#contact" data-service="Heating">{content.cards[1].buttonText} <span aria-hidden="true">↗</span></a>
          </article>
        </div>
      </div>
    </section>
  );
}
