"use client";

import { useEffect, useRef, useState } from "react";
import { githubRepositoryUrl } from "@/lib/community";
import { withBasePath } from "@/lib/base-path";
import { communityFetch } from "@/lib/community-resilience";
import {
  publicWebsite,
  type RepositorySuggestions,
} from "@/lib/github-repository";
import { GitHubIcon } from "./GitHubIcon";

type Result = {
  repository: string;
  data?: RepositorySuggestions;
  error?: string;
};
export function GitHubRepositoryPanel({
  repository,
  onSuggestions,
}: {
  repository: string;
  onSuggestions?: (data: RepositorySuggestions, replace: boolean) => void;
}) {
  const canonical = githubRepositoryUrl(repository);
  const [result, setResult] = useState<Result | null>(null);
  const [retry, setRetry] = useState(0);
  const apply = useRef(onSuggestions);
  apply.current = onSuggestions;
  useEffect(() => {
    if (!canonical) return;
    let alive = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await communityFetch(
          withBasePath(
            `/api/github-repository/?${new URLSearchParams({ repository: canonical })}`,
          ),
          { signal: controller.signal },
        );
        const body = await response.json();
        if (!alive) return;
        if (!response.ok || !body.data) {
          setResult({
            repository: canonical,
            error:
              body.error ||
              "GitHub details are unavailable. Enter them yourself.",
          });
          return;
        }
        setResult({ repository: canonical, data: body.data });
        apply.current?.(body.data, false);
      } catch {
        if (alive)
          setResult({
            repository: canonical,
            error:
              "Could not reach GitHub. You can still enter the details yourself.",
          });
      }
    }, 500);
    return () => {
      alive = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [canonical, retry]);
  if (!canonical) return null;
  const current = result?.repository === canonical ? result : null;
  const data = current?.data;
  const website = publicWebsite(data?.website);
  return (
    <section
      className="my-5 min-w-0 rounded-[28px] bg-surface p-5 sm:p-6"
      aria-label="GitHub repository details"
    >
      <h2 className="flex items-center gap-2 font-display text-xl font-bold">
        <GitHubIcon />
        {onSuggestions ? "Details from GitHub" : "Project website"}
      </h2>
      <p role="status" className="mt-2 text-sm text-muted">
        {!current
          ? "Getting repository details…"
          : current.error ||
            (onSuggestions
              ? "Suggestions are ready. Empty fields were filled; your edits are kept."
              : "Website supplied by this repository’s owner.")}
      </p>
      {current?.error && (
        <button
          type="button"
          className="btn btn-secondary mt-3"
          onClick={() => {
            setResult(null);
            setRetry((value) => value + 1);
          }}
        >
          Retry GitHub lookup
        </button>
      )}
      {data && onSuggestions && (
        <>
          <p className="mt-4 break-words font-semibold">{data.title}</p>
          <p className="mt-2 break-words text-sm text-body">
            {data.description ||
              "This repository has no description. Add your own below."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-paper px-3 py-1 text-xs text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary mt-4"
            onClick={() => onSuggestions(data, true)}
          >
            Use GitHub suggestions
          </button>
          <p className="mt-2 text-xs text-muted">
            This replaces your title, description and tags with the available
            suggestions. Review them before submitting.
          </p>
        </>
      )}
      {website && (
        <>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold">Landing page preview</h3>
            <a
              className="btn btn-secondary"
              href={website}
              target="_blank"
              rel="noopener noreferrer ugc"
            >
              Open website <span aria-hidden="true">↗</span>
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>
          <p className="my-3 text-sm text-muted">
            This is an external website. Some sites block embedded previews or
            need browser features unavailable here. If the frame is blank, use
            Open website. Screenshots remain the showcase cover.
          </p>
          <iframe
            key={canonical}
            title="Landing page preview"
            src={withBasePath(
              `/repository-preview/?${new URLSearchParams({ repository: canonical })}`,
            )}
            sandbox="allow-scripts"
            referrerPolicy="no-referrer"
            loading="lazy"
            className="h-[480px] w-full rounded-2xl border border-rule bg-paper"
          />
        </>
      )}
      {data && !website && (
        <p className="mt-4 text-sm text-body">
          No public HTTPS website is set for this repository. Add its deployed
          URL in GitHub’s About → Website field, then retry later. Your
          screenshots will still display here.
        </p>
      )}
    </section>
  );
}
