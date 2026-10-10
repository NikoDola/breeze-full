import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { site } from "@/lib/site";

export default function NotFound() {
  return (
    <section className="not-found-section-1">
      <span className="not-found-badge-1">
        <Icon name="snowflake" className="not-found-icon-1" />
      </span>
      <p className="not-found-copy-1">
        404
      </p>
      <h1 className="not-found-heading-1">
        This page went out cold.
      </h1>
      <p className="not-found-copy-2">
        We couldn&rsquo;t find what you were looking for — but we can definitely
        find your thermostat.
      </p>

      <div className="not-found-layout-1">
        <Link
          href="/"
          className="not-found-button-1"
        >
          Back home
        </Link>
        <Link
          href="/services"
          className="not-found-button-2"
        >
          All services
        </Link>
        <a
          href={site.phoneHref}
          className="not-found-button-3"
        >
          <Icon name="phone" className="not-found-icon-2" />
          {site.phone}
        </a>
      </div>
    </section>
  );
}
