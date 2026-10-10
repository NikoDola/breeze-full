export default function SeasonsSection() {
  return (
    <section className="section seasons" id="heating-cooling" aria-labelledby="seasons-title">
      <div className="wrap">
        <div className="section-heading"><div><h2 id="seasons-title">A good day starts<br />at the <em>right temperature.</em></h2></div><p>Whatever Tennessee weather has planned, we have your comfort covered.</p></div>
        <div className="season-grid">
          <article className="season-card cooling">
            <div className="season-top"><span className="season-icon" aria-hidden="true">❄</span></div>
            <h3>Keep your cool.</h3><p className="season-label">Cooling</p>
            <p>Our expert technicians work to cool your TN home efficiently and affordably with high-quality Middle Tennessee cooling systems, maintenance and emergency repairs. Trust us with your comfort.</p>
            <a href="#contact" data-service="Cooling">Request cooling service <span aria-hidden="true">↗</span></a>
          </article>
          <article className="season-card heating">
            <div className="season-top"><span className="season-icon" aria-hidden="true">☀</span></div>
            <h3>Bring on cozy.</h3><p className="season-label">Heating</p>
            <p>From new installations and retrofits to emergency repairs and maintenance, Breeze delivers award-winning Middle Tennessee heating services to TN customers. Your satisfaction is our priority.</p>
            <a href="#contact" data-service="Heating">Request heating service <span aria-hidden="true">↗</span></a>
          </article>
        </div>
      </div>
    </section>
  );
}
