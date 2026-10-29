"use client";
import { useState } from "react";
import { storePreview } from "@/lib/full-preview";

export function OpenFullPreview({
  title,
  getDocument,
  className,
}: {
  title: string;
  getDocument: () => string;
  className?: string;
}) {
  const [error, setError] = useState("");
  return (
    <>
      <a
        href="/preview/"
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label="Open full preview (opens in a new tab)"
        onClick={(event) => {
          try {
            const href = storePreview(
              localStorage,
              {
                title: title.slice(0, 160),
                document: getDocument(),
                returnTo: location.pathname + location.search + location.hash,
                createdAt: Date.now(),
              },
              crypto.randomUUID(),
            );
            event.currentTarget.href = href;
            setError("");
          } catch {
            event.preventDefault();
            setError(
              "Could not open the preview. Check the source size and allow browser storage, then try again.",
            );
          }
        }}
      >
        Open full preview ↗
      </a>
      {error && (
        <p role="alert" className="w-full text-sm text-red">
          {error}
        </p>
      )}
    </>
  );
}
