"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import Icon from "./Icon";

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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shots.map((shot, i) => (
          <button
            key={shot.src}
            onClick={() => setActive(i)}
            className="group relative aspect-4/3 overflow-hidden rounded-4xl bg-slate-100"
            aria-label={`View ${shot.alt}`}
          >
            <Image
              src={shot.src}
              alt={shot.alt}
              width={900}
              height={675}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-linear-to-t from-ink/70 via-ink/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="absolute bottom-4 left-4 right-4 flex items-center gap-2 text-left text-sm font-bold text-white opacity-0 transition-opacity group-hover:opacity-100">
              <Icon name="image" className="h-4 w-4 shrink-0" />
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
          className="fixed inset-0 z-100 grid place-items-center bg-ink/90 p-5 backdrop-blur-sm"
        >
          <button
            onClick={() => setActive(null)}
            aria-label="Close"
            className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>

          <figure
            onClick={(e) => e.stopPropagation()}
            className="max-h-full w-full max-w-4xl"
          >
            <Image
              src={shots[active].src}
              alt={shots[active].alt}
              width={1600}
              height={1200}
              className="max-h-[75vh] w-full rounded-3xl object-contain"
            />
            <figcaption className="mt-4 text-center text-sm font-semibold text-white/70">
              {shots[active].alt} · {active + 1} / {shots.length}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}
