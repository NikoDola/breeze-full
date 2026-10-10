import PageHero from "./PageHero";
import CtaBand from "./CtaBand";
import Icon from "@/components/ui/Icon";
import { site } from "@/lib/site";
import type { LegalSection } from "@/lib/legal";

export default function LegalPage({
  title,
  effectiveLabel,
  intro,
  sections,
}: {
  title: string;
  effectiveLabel: string;
  intro?: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <PageHero title={title} eyebrow="Legal" />

      <section className="legal-page-section-1">
        <p className="legal-page-copy-1">
          <Icon name="calendar" className="legal-page-icon-1" />
          {effectiveLabel}
        </p>

        {intro && (
          <p className="legal-page-copy-2">{intro}</p>
        )}

        <div className="legal-page-block-1">
          {sections.map((s) => (
            <section key={s.heading}>
              <h2>{s.heading}</h2>
              {s.paragraphs?.map((p) => <p key={p}>{p}</p>)}
              {s.items && (
                <ul>
                  {s.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section>
            <h2>Contact</h2>
            <p>
              <strong>{site.legalName}</strong>
              <br />
              {site.addressLine}, {site.address.country}
              <br />
              Email:{" "}
              <a href={site.emailHref}>{site.email}</a>
              <br />
              Phone: <a href={site.phoneHref}>{site.phone}</a>
            </p>
          </section>
        </div>
      </section>

      <CtaBand />
    </>
  );
}
