import { contentDefinitions, contentText as t, contentItems as items, type ContentRecord } from "../../../../cms/shared/content";
export default function StorySection({ content: c = contentDefinitions["why-choose-breeze"].seed.content }: { content?: ContentRecord }) {
  return (
    <section className="section story" id="about" aria-labelledby="story-title">
      <div className="wrap"><div className="story-head"><h2 id="story-title">{t(c, "storyHeading")} <em>{t(c, "storyAccent")}</em></h2></div><div className="story-grid">
        {items(c, "stories").map((card, index) => <article className="story-card" key={t(card, "id")}><span className="story-mark" aria-hidden="true">{index % 2 === 0 ? "✳" : "♡"}</span><h3>{t(card, "heading")}</h3><p>{t(card, "body")}</p></article>)}

      </div></div>
    </section>
  );
}
