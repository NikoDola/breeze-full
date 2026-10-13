import { homeSeed } from "../../../../cms/shared/home-seed";
import { homeMapSource, type AreaContent } from "../../../../cms/shared/home";
import RichTextContent from "@/components/ui/RichTextContent";

export default function AreaSection({ content = homeSeed.slots.area.content }: { content?: AreaContent }) {
  return (
    <section className="section map-section" id="area" aria-labelledby="area-title"><div className="wrap map-grid">
      <div className="map-copy"><h2 id="area-title">{"headingAccent" in content ? <>{content.heading.trimEnd() + " "}<em>{content.headingAccent}</em></> : <RichTextContent value={content.heading} />}</h2><p>{content.body}</p><a className="text-link" href={content.mapsHref} target="_blank" rel="noopener noreferrer">{content.linkText} <span aria-hidden="true">↗</span></a></div>
      <div className="map-frame"><iframe title={content.mapTitle} src={homeMapSource(content.mapLocation)} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
    </div></section>
  );
}
