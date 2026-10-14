"use client";

import { useEffect, useRef } from "react";
import styles from "./parallax-hero-photo.module.css";

export default function ParallaxHeroPhoto({ image }: { image: string }) {
  const photoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const photo = photoRef.current;
    const hero = photo?.parentElement;
    if (!photo || !hero) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    function update() {
      frame = 0;
      const bounds = hero!.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) return;
      const offset = Math.min(120, Math.max(0, window.scrollY * 0.35));
      photo!.style.setProperty("--hero-parallax-offset", `${offset}px`);
    }

    function scheduleUpdate() {
      if (!frame) frame = window.requestAnimationFrame(update);
    }

    function syncMotionPreference() {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      window.cancelAnimationFrame(frame);
      frame = 0;
      photo!.style.removeProperty("--hero-parallax-offset");
      if (!reducedMotion.matches) {
        window.addEventListener("scroll", scheduleUpdate, { passive: true });
        window.addEventListener("resize", scheduleUpdate);
        scheduleUpdate();
      }
    }

    syncMotionPreference();
    reducedMotion.addEventListener("change", syncMotionPreference);
    return () => {
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      reducedMotion.removeEventListener("change", syncMotionPreference);
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
