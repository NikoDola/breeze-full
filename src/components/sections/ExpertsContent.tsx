import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { bestInTown as defaultBest, sayYesToTheBest as defaultExperts, longAndShort as defaultClosing } from "@/lib/company";
import { contentText as t, type ContentRecord } from "../../../cms/shared/content";
import navigation from "./service-navigation.module.css";

/**
 * Feature sections for Why Choose Breeze. Its CMS copy is independent of the
 * Experts and Going green articles rendered by ContentPageView.
 */
export default function ExpertsContent({
  related,
  article = false,
  content,
}: {
  related: { label: string; href: string }[];
  article?: boolean;
  content?: ContentRecord;
}) {
  const bestInTown = content ? { heading: t(content, "ownerHeading"), body: t(content, "ownerBody") } : defaultBest;
  const sayYesToTheBest = content ? { heading: t(content, "expertHeading"), paragraphs: t(content, "expertBody").split("\n\n") } : defaultExperts;
  const longAndShort = content ? { heading: t(content, "closingHeading"), paragraphs: t(content, "closingBody").split("\n\n") } : defaultClosing;
  return (
    <section className={`experts-content-section-1${article ? " experts-content-article" : ""}`}>
      <div className="experts-content-layout-1">
        <div className="experts-content-body">
          <div className="experts-content-layout-2">
            {!article && <div className="experts-content-card-1">
              <Image
                src="/images/Guy-working.jpg"
                alt="A Breeze technician at work"
                width={1000}
                height={800}
                className="experts-content-image-1"
              />
            </div>}
            <div>
              <h2 className="experts-content-heading-1">
                {bestInTown.heading}
              </h2>
              <p className="experts-content-copy-1">
                {bestInTown.body}
              </p>
            </div>
          </div>

          <div className="experts-content-block-1">
            <h2 className="experts-content-heading-2">
              {sayYesToTheBest.heading}
            </h2>
            <div className="experts-content-block-2">
              {sayYesToTheBest.paragraphs.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>

          <div className="experts-content-card-2">
            <span className="experts-content-badge-1">
              <Icon name="check" className="experts-content-icon-1" />
            </span>
            <h3 className="experts-content-heading-3">
              {longAndShort.heading}
            </h3>
            {longAndShort.paragraphs.map((p, i) => (
              <p
                key={p}
                className={`experts-content-copy-2 ${
                  i === longAndShort.paragraphs.length - 1
                    ? "experts-content-copy-2-state-1-active"
                    : "experts-content-copy-2-state-1-inactive"
                }`}
              >
                {p}
              </p>
            ))}
          </div>
        </div>

        {article ? <aside className={navigation.navigation}>
          <div className={navigation.panel}>
            <h2>Keep reading</h2>
            <nav className={navigation.articleLinks} aria-label="Related pages">
              {related.map(link => <Link key={link.href} href={link.href} className={navigation.link}>
                <span className={navigation.icon}><Icon name="arrow" /></span>
                <span>{link.label}</span>
              </Link>)}
            </nav>
          </div>
        </aside> : <aside className="experts-content-aside-1">
          <h2 className="experts-content-heading-4">
            Keep reading
          </h2>
          <nav className="experts-content-nav-1">
            {related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="experts-content-button-1"
              >
                <span className="experts-content-text-1">
                  {r.label}
                </span>
                <Icon
                  name="arrow"
                  className="experts-content-icon-2"
                />
              </Link>
            ))}
          </nav>
        </aside>}
      </div>
    </section>
  );
}
