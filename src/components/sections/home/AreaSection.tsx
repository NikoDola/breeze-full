import { site } from "@/lib/site";

export default function AreaSection() {
  return (
    <section className="section map-section" id="area" aria-labelledby="area-title"><div className="wrap map-grid">
      <div className="map-copy"><h2 id="area-title">Made for Middle <em>Tennessee.</em></h2><p>From Nashville to Brentwood and the communities around them, friendly comfort care is close to home.</p><a className="text-link" href={site.mapsHref} target="_blank" rel="noopener noreferrer">Explore Nashville on Google Maps <span aria-hidden="true">↗</span></a></div>
      <div className="map-frame"><iframe title="Google Map of Nashville, Tennessee" src="https://www.google.com/maps?q=Nashville%2C%20TN&output=embed" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
    </div></section>
  );
}
