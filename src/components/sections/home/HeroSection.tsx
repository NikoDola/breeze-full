import Image from "next/image";
import Link from "next/link";
import { Fragment } from "react";
import { site as defaultSite, type SiteData } from "@/lib/site";
import RichTextContent from "@/components/ui/RichTextContent";
import { editableHero, homeHeroSeed, type HeroContent, type LegacyHeroContent } from "../../../../cms/shared/home-hero";
import type { RichTextNode } from "../../../../cms/shared/rich-text";

export default function HeroSection({ site = defaultSite, content: source = homeHeroSeed }: { site?: SiteData; content?: HeroContent | LegacyHeroContent }) {
  const content = editableHero(source);
  const headingLines: RichTextNode[][] = [[]];
  for (const node of content.heading.content) {
    if (node.type === "break") headingLines.push([]);
    else headingLines[headingLines.length - 1].push(node);
  }
  const rating = Number(content.googleRating).toFixed(1);
  const reviewLabel = `${content.googleReviewCount} Google ${content.googleReviewCount === "1" ? "review" : "reviews"}`;
  return (
    <>
    <link rel="preload" as="image" href="/images/hero-full.webp" media="(max-width: 700px)" fetchPriority="high" />
    <link rel="preload" as="image" href="/images/hero-bg.webp" media="(min-width: 700.01px)" fetchPriority="high" />
    <link rel="preload" as="image" href="/images/hero-family.webp" media="(min-width: 700.01px)" fetchPriority="high" />
    <section className="hero" id="hero" aria-labelledby="hero-title">
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
            {headingLines.map((line, index) => <Fragment key={index}>{index > 0 && " "}<span className="hero-title-line">{line.length ? <RichTextContent value={{ version: 1, content: line }} /> : <br />}</span></Fragment>)}
          </h1>
          <div className="hero-trust">
            <Link className="hero-google-reviews" href="/reviews" aria-label={`Rated ${rating} out of 5 on Google from ${content.googleReviewCount} ${content.googleReviewCount === "1" ? "review" : "reviews"}. Read our client reviews.`}>
              <span className="hero-google-mark"><Image src="/images/google-g.png" width={24} height={24} alt="" loading="eager" /></span>
              <span className="hero-google-details">
                <span className="hero-google-rating"><strong>{rating}</strong><span className="hero-google-stars" aria-hidden="true" style={{ position: "relative", display: "inline-block" }}>
                  <span style={{ opacity: 0.3 }}>★★★★★</span>
                  <span style={{ position: "absolute", inset: 0, width: `${Number(rating) * 20}%`, overflow: "hidden", whiteSpace: "nowrap" }}>★★★★★</span>
                </span></span>
                <span className="hero-google-count">{reviewLabel}</span>
              </span>
            </Link>
            <p className="hero-intro">{content.intro.split(/\r?\n/).map((line, index) => <Fragment key={index}>{index > 0 && <br />}{line}</Fragment>)}</p>
          </div>
          <div className="hero-buttons">
            <a className="button orange" href="#contact">{content.buttonText} <span aria-hidden="true">↗</span></a>
            <a className="button ghost" href={site.phoneHref}>{content.phoneButtonText} {site.phone}</a>
          </div>
        </div>
        <div className="hero-sticker" aria-label="Over two decades of local comfort care"><span>20+</span><small>years keeping<br />Middle TN comfy</small></div>
      </div>
    </section>
    </>
  );
}
