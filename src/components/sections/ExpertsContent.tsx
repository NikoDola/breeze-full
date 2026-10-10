import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { bestInTown, sayYesToTheBest, longAndShort } from "@/lib/company";

/**
 * /why-choose-breeze, /meet-the-hvac-experts and /going-green publish identical
 * body copy on the live site, so they render this shared block.
 */
export default function ExpertsContent({
  related,
}: {
  related: { label: string; href: string }[];
}) {
  return (
    <section className="experts-content-section-1">
      <div className="experts-content-layout-1">
        <div>
          <div className="experts-content-layout-2">
            <div className="experts-content-card-1">
              <Image
                src="/images/Guy-working.jpg"
                alt="A Breeze technician at work"
                width={1000}
                height={800}
                className="experts-content-image-1"
              />
            </div>
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

        <aside className="experts-content-aside-1">
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
        </aside>
      </div>
    </section>
  );
}
