import CareersForm from "./CareersForm";
import Icon from "@/components/ui/Icon";
import { contentItems, contentText, type ContentRecord } from "../../../cms/shared/content";

export default function CareersContent({ content }: { content: ContentRecord }) {
  return <section className="careers-section-1"><div className="careers-layout-1">
    <div className="careers-block-1">{contentItems(content, "cards").map((card, index) => {
      const tone = index % 2 === 0 ? 1 : 2;
      return <div key={contentText(card, "id")} className={`careers-card-${tone}`}>
        <span className={`careers-badge-${tone}`}><Icon name={index === 0 ? "wrench" : "star"} className={tone === 1 ? "careers-icon-1" : "careers-icon-3"} /></span>
        <h2 className={`careers-heading-${tone}`}>{contentText(card, "heading")}</h2>
        <ul className={`careers-ul-${tone}`}>{contentItems(card, "items").map(item => <li key={contentText(item, "id")} className={`careers-li-${tone}`}><Icon name="check" className={tone === 1 ? "careers-icon-2" : "careers-icon-4"} />{contentText(item, "text")}</li>)}</ul>
      </div>;
    })}</div>
    <CareersForm heading={contentText(content, "formHeading")} />
  </div></section>;
}
