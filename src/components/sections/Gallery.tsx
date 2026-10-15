"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";

export type Shot = { id: string; src: string; alt: string; caption: string; width: number; height: number; unoptimized?: boolean };

export default function Gallery({ shots }: { shots: Shot[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = shots.findIndex(shot => shot.id === activeId);
  const activeShot = shots[active];

  useEffect(() => {
    if (!activeShot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
      if (e.key === "ArrowRight") setActiveId(shots[(active + 1) % shots.length].id);
      if (e.key === "ArrowLeft") setActiveId(shots[(active - 1 + shots.length) % shots.length].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, activeShot, shots]);

  return (
    <>
      <div className="gallery-layout-1">
        {shots.map((shot) => (
          <button
            key={shot.id}
            onClick={() => setActiveId(shot.id)}
            className="gallery-button-1"
            aria-label={`View ${shot.caption}`}
          >
            <Image
              src={shot.src}
              unoptimized={shot.unoptimized}
              alt={shot.alt}
              width={shot.width}
              height={shot.height}
              className="gallery-image-1"
            />
            <span className="gallery-text-1" />
            <span className="gallery-text-2">
              <Icon name="image" className="gallery-icon-1" />
              {shot.caption}
            </span>
          </button>
        ))}
      </div>

      {activeShot && (
        <div
          onClick={() => setActiveId(null)}
          role="dialog"
          aria-modal="true"
          aria-label={activeShot.caption}
          className="gallery-layout-2"
        >
          <button
            onClick={() => setActiveId(null)}
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
              src={activeShot.src}
              unoptimized={activeShot.unoptimized}
              alt={activeShot.alt}
              width={activeShot.width}
              height={activeShot.height}
              className="gallery-image-2"
            />
            <figcaption className="gallery-figcaption-1">
              {activeShot.caption} · {active + 1} / {shots.length}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
