import PageHero from "./PageHero";
import CtaBand from "./CtaBand";
import Icon from "./Icon";
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

      <section className="mx-auto max-w-3xl px-5 py-14 lg:px-8 lg:py-20">
        <p className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Icon name="calendar" className="h-3.5 w-3.5" />
          {effectiveLabel}
        </p>

        {intro && (
          <p className="mt-6 text-lg leading-relaxed text-slate-600">{intro}</p>
        )}

        <div className="prose-breeze mt-4">
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
