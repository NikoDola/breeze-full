"use client";

import { useEffect, useRef } from "react";
import styles from "./parallax-hero-photo.module.css";

export default function ParallaxHeroPhoto({ image }: { image: string }) {
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const photo = photoRef.current;
    const hero = photo?.parentElement;
    if (!photo || !hero) return;

    const startTop = hero.getBoundingClientRect().top + window.scrollY;
    let frame = 0;

    function update() {
      frame = 0;
      const bounds = hero!.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      const offset = Math.min(120, Math.max(0, (startTop - bounds.top) * 0.35));
      photo!.style.setProperty("--hero-parallax-offset", `${offset}px`);
    }

    function scheduleUpdate() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    // This service-hero effect is explicitly requested even with reduced motion.
    // Capture also handles scrolling inside a containing element.
    document.addEventListener("scroll", scheduleUpdate, { capture: true, passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();
    return () => {
      document.removeEventListener("scroll", scheduleUpdate, true);
      window.removeEventListener("resize", scheduleUpdate);
      window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={photoRef}
      aria-hidden="true"
      className={`inner-hero-photo ${styles.photo}`}
      style={{ backgroundImage: `url(${image})` }}
    />
  );
}
