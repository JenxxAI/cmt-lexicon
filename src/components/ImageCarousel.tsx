"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export type CarouselSlide = { src: string | undefined; alt: string };

const arrow =
  "absolute top-1/2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-surface/90 text-ink shadow-md hover:bg-surface disabled:pointer-events-none disabled:opacity-0";
/**
 * Sideways image carousel built on native scroll-snap, so touch swipe, trackpads and the
 * keyboard all work without a library. One slide shows no controls. Arrow keys move the focused
 * scroller; the buttons cover mouse and screen-reader users. `href` makes each image a
 * non-focusable duplicate of the card's own link.
 */
export function ImageCarousel({
  slides,
  label,
  href,
  fit = "cover",
  aspect = "aspect-[16/10]",
}: {
  slides: CarouselSlide[];
  label: string;
  href?: string;
  fit?: "cover" | "contain";
  aspect?: string;
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const total = slides.length;
  function go(to: number) {
    const element = scroller.current;
    if (!element) return;
    const next = Math.min(total - 1, Math.max(0, to));
    element.scrollTo({ left: next * element.clientWidth });
  }
  const fitClass = fit === "contain" ? "object-contain bg-paper" : "object-cover";
  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label={label}
      className="relative"
    >
      <div
        ref={scroller}
        tabIndex={total > 1 ? 0 : undefined}
        aria-label={total > 1 ? `${label} slides` : undefined}
        onScroll={(event) => {
          const element = event.currentTarget;
          setIndex(Math.round(element.scrollLeft / (element.clientWidth || 1)));
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") go(index + 1);
          else if (event.key === "ArrowLeft") go(index - 1);
          else return;
          event.preventDefault();
        }}
        className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[20px] bg-paper scroll-smooth [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, position) => {
          const image = slide.src ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed, short-lived Supabase URL
            <img
              src={slide.src}
              alt={slide.alt}
              loading={position === 0 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
              className={`${aspect} w-full ${fitClass}`}
            />
          ) : (
            <div className={`${aspect} w-full animate-pulse bg-rule`} role="img" aria-label={`${slide.alt} (loading)`} />
          );
          return (
            <div
              key={position}
              role="group"
              aria-roledescription="slide"
              aria-label={`${position + 1} of ${total}`}
              className="w-full shrink-0 snap-center"
            >
              {href ? (
                <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
                  {image}
                </Link>
              ) : (
                image
              )}
            </div>
          );
        })}
      </div>
      {total > 1 && (
        <>
          <button
            type="button"
            className={`${arrow} left-2`}
            aria-label="Previous image"
            disabled={index === 0}
            onClick={() => go(index - 1)}
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            className={`${arrow} right-2`}
            aria-label="Next image"
            disabled={index === total - 1}
            onClick={() => go(index + 1)}
          >
            <span aria-hidden="true">→</span>
          </button>
          <p
            aria-hidden="true"
            className="pointer-events-none absolute bottom-2 right-3 rounded-full bg-ink/75 px-2.5 py-0.5 font-mono text-xs text-surface"
          >
            {index + 1} / {total}
          </p>
          <p role="status" className="sr-only">
            Image {index + 1} of {total}
          </p>
        </>
      )}
    </div>
  );
}
