"use client";

import Link from "next/link";
import { useState } from "react";

/** A single cover and title keep the public gallery focused on the work. */
export function CommunityBrowseCard({
  id,
  title,
  cover,
}: {
  id: string;
  title: string;
  cover?: string;
}) {
  const [failedCover, setFailedCover] = useState<string | null>(null);
  return (
    <li className="min-w-0">
      <Link
        href={`/community/project/?id=${id}`}
        className="group block rounded-[24px] bg-surface p-3 outline-offset-4 transition-colors hover:bg-paper focus-visible:outline-2 focus-visible:outline-accent-deep motion-reduce:transition-none"
      >
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-paper">
          {cover && failedCover !== cover ? (
            // eslint-disable-next-line @next/next/no-img-element -- same-origin, short-lived preview URL
            <img
              src={cover}
              alt=""
              loading="lazy"
              decoding="async"
              onError={() => setFailedCover(cover)}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid h-full place-items-center bg-accent-soft text-accent-deep"
            >
              <svg
                width="72"
                height="72"
                viewBox="0 0 64 64"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="6" y="10" width="52" height="44" rx="8" />
                <path d="M6 22h52M15 16h1m5 0h1m5 0h1M25 32l-7 6 7 6m14-12 7 6-7 6m-5-14-4 16" />
              </svg>
            </div>
          )}
        </div>
        <h2 className="flex min-h-14 items-center px-2 pt-2 font-display text-base font-bold leading-snug text-ink transition-colors group-hover:text-accent-deep motion-reduce:transition-none">
          <span className="line-clamp-2 break-words" title={title}>
            {title}
          </span>
        </h2>
      </Link>
    </li>
  );
}
