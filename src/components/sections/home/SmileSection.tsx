import Link from "next/link";

export default function SmileSection() {
  return (
    <section className="section smile" id="smile" aria-labelledby="smile-title">
      <div className="wrap smile-grid">
        <div className="smile-art"><img src="/template-2/family-comfort.jpg" alt="Family relaxing together at home" loading="lazy" width="1000" height="667" /><div className="smile-seal" aria-hidden="true">GOOD SERVICE<br /><strong>FEELS GOOD</strong><span>☺</span></div></div>
        <div className="smile-copy"><h2 id="smile-title">1st Class Service With A <em>Smile.</em></h2><p>Welcome to Breeze Heating &amp; Cooling: where quality and service never go out of style. Serving Middle Tennessee, Breeze delivers client-focused service. Throughout every visit, we treat your property and family with respect. And, when it comes to indoor comfort, there&apos;s nothing we can&apos;t handle. We&apos;re a Middle Tennessee mainstay, and a trusted partner for all of your HVAC needs.</p><Link className="text-link" href="/about-us">A little more about us <span aria-hidden="true">↗</span></Link></div>
      </div>
    </section>
  );
}
