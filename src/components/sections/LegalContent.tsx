import PageHero from "./PageHero";
import CtaBandContent from "./CtaBandContent";
import Icon from "@/components/ui/Icon";
import PublicEmail from "@/components/ui/PublicEmail";
import type { SiteData } from "@/lib/site";
import type { LegalSection } from "@/lib/legal";

export default function LegalContent({
  site,
  title,
  effectiveLabel,
  intro,
  sections,
  heroImage,
  showIntegrationDisclosure = false,
}: {
  site: SiteData;
  title: string;
  effectiveLabel: string;
  intro?: string;
  sections: LegalSection[];
  heroImage?: string;
  showIntegrationDisclosure?: boolean;
}) {
  return (
    <>
      <PageHero title={title} eyebrow="Legal" image={heroImage} />

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

          {showIntegrationDisclosure && <>
            <section>
              <h2>Service requests through Housecall Pro</h2>
              <p>Our service request form is provided by Housecall Pro. Information you enter and submit is sent directly to Breeze Heating &amp; Cooling through Housecall Pro so we can respond to your request and arrange service. The embedded form connects to Housecall Pro when it loads.</p>
              <p>Learn more in <a href="https://www.housecallpro.com/privacy/" target="_blank" rel="noopener noreferrer">Housecall Pro&rsquo;s Privacy Policy</a>.</p>
            </section>
            <section>
              <h2>Optional website analytics</h2>
              <p>If you allow analytics, we use Microsoft Clarity to understand how visitors use our website through heatmaps and session replays. Clarity may collect browser and device information, page interactions, clicks and scrolling, and use cookies or similar technologies. We use these insights to improve the website.</p>
              <p>Clarity masks input fields by default and cannot record the contents of our embedded Housecall Pro form. We do not grant advertising storage through our Clarity consent settings. You can decline analytics or change your choice using &ldquo;Privacy choices&rdquo; in the website footer. Withdrawing consent reloads the page to stop Clarity.</p>
              <p>See the <a href="https://privacy.microsoft.com/privacystatement" target="_blank" rel="noopener noreferrer">Microsoft Privacy Statement</a> for more about how Microsoft processes data.</p>
            </section>
          </>}

          <section>
            <h2>Contact</h2>
            <p>
              <strong>{site.legalName}</strong>
              <br />
              {site.addressLine}, {site.address.country}
              <br />
              Email:{" "}
              <PublicEmail email={site.email} href={site.emailHref} />
              <br />
              Phone: <a href={site.phoneHref}>{site.phone}</a>
            </p>
          </section>
        </div>
      </section>

      <CtaBandContent site={site} />
    </>
  );
}
