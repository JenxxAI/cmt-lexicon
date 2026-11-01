"use client";

import Link from "next/link";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      className="my-12 rounded-[28px] bg-surface p-6 sm:p-10"
      aria-labelledby="page-error-heading"
    >
      <h1 id="page-error-heading" className="font-display text-3xl font-bold">
        This page couldn’t finish loading
      </h1>
      <p role="alert" className="mt-4 max-w-xl text-body">
        Try again. If you’re offline, reconnect first. If this happened in the
        editor, a successfully saved local draft will be restored when you
        return.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={reset}
          className="inline-flex min-h-11 items-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-surface"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex min-h-11 items-center rounded-full bg-line px-5 py-3 text-sm font-semibold text-ink"
        >
          Back to UI Lexicon
        </Link>
      </div>
    </section>
  );
}
