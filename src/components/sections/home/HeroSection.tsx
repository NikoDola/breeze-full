import { site } from "@/lib/site";

export default function HeroSection() {
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-photo" role="img" aria-label="A family relaxing together in a bright, comfortable home">
        <svg className="hero-breeze" viewBox="0 0 1672 941" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <path id="hero-breeze-path-1" d="M-120 425C160 285 390 285 600 330S1060 475 1380 330 1640 190 1790 245" />
            <path id="hero-breeze-path-2" d="M-110 495C170 345 400 340 610 385S1060 530 1390 385 1650 245 1790 290" />
            <path id="hero-breeze-path-3" d="M-100 565C180 400 395 390 610 440S1050 600 1390 435 1640 280 1790 330" />
            <path id="hero-breeze-path-4" d="M-110 635C165 475 405 465 625 520S1070 665 1430 500 1655 360 1790 385" />
            <path id="hero-breeze-path-5" d="M-120 705C175 545 420 545 650 600S1100 725 1470 565 1680 445 1790 455" />
          </defs>
          {[1, 2, 3, 4, 5].map((line) => (
            <g className={`hero-breeze-line hero-breeze-line-${line}`} key={line}>
              <use className="hero-breeze-stroke" href={`#hero-breeze-path-${line}`} />
            </g>
          ))}
        </svg>
      </div>
      <div className="hero-shade" />
      <div className="wrap hero-content">
        <div className="hero-copy">
          <h1 id="hero-title">
            <span className="hero-title-line">Home feels</span>{" "}
            <span className="hero-title-line"><em>better</em> with a</span>{" "}
            <span className="hero-title-line">little Breeze<span className="period">.</span></span>
          </h1>
          <p className="hero-intro">Friendly heating and cooling care for the places and people that matter most.</p>
          <div className="hero-buttons">
            <a className="button orange" href="#contact">Let&apos;s get comfortable <span aria-hidden="true">↗</span></a>
            <a className="button ghost" href={site.phoneHref}>Call {site.phone}</a>
          </div>
        </div>
        <div className="hero-sticker" aria-label="Over two decades of local comfort care"><span>20+</span><small>years keeping<br />Middle TN comfy</small></div>
      </div>
    </section>
  );
}
