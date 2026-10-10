"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";

export type Shot = { src: string; alt: string };

export default function Gallery({ shots }: { shots: Shot[] }) {
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((i) => ((i ?? 0) + 1) % shots.length);
      if (e.key === "ArrowLeft")
        setActive((i) => ((i ?? 0) - 1 + shots.length) % shots.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, shots.length]);

  return (
    <>
      <div className="gallery-layout-1">
        {shots.map((shot, i) => (
          <button
            key={shot.src}
            onClick={() => setActive(i)}
            className="gallery-button-1"
            aria-label={`View ${shot.alt}`}
          >
            <Image
              src={shot.src}
              alt={shot.alt}
              width={900}
              height={675}
              className="gallery-image-1"
            />
            <span className="gallery-text-1" />
            <span className="gallery-text-2">
              <Icon name="image" className="gallery-icon-1" />
              {shot.alt}
            </span>
          </button>
        ))}
      </div>

      {active !== null && (
        <div
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={shots[active].alt}
          className="gallery-layout-2"
        >
          <button
            onClick={() => setActive(null)}
            aria-label="Close"
            className="gallery-button-2"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="gallery-icon-2"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>

          <figure
            onClick={(e) => e.stopPropagation()}
            className="gallery-figure-1"
          >
            <Image
              src={shots[active].src}
              alt={shots[active].alt}
              width={1600}
              height={1200}
              className="gallery-image-2"
            />
            <figcaption className="gallery-figcaption-1">
              {shots[active].alt} · {active + 1} / {shots.length}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
