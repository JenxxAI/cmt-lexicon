"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CommunityClient } from "@/lib/supabase";
import type { CommunitySession as Session } from "@/lib/community-session";
import { communityError } from "@/lib/community-resilience";

export function ProjectBookmark({
  client,
  session,
  id,
}: {
  client: CommunityClient | null;
  session: Session | null;
  id: string;
}) {
  const [saved, setSaved] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let alive = true;
    setSaved(null);
    setError("");
    if (client && session)
      client
        .bookmark(id)
        .then(({ data, error }) => {
          if (!alive) return;
          if (error) setError("Could not load your saved status.");
          else setSaved(data === true);
        })
        .catch(() => {
          if (alive) setError("Could not load your saved status.");
        });
    return () => {
      alive = false;
    };
  }, [client, session, id, retry]);
  async function save() {
    if (!client || !session || saved === null || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const result = await client.rpc("save_community_project", {
        p_id: id,
        p_saved: !saved,
      });
      if (result.error) setError(communityError(result.error));
      else setSaved(result.data === true);
    } catch (error) {
      setError(communityError(error));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  if (!session)
    return (
      <Link className="btn btn-secondary mt-5" href="/community/auth/">
        Sign in to save
      </Link>
    );
  return (
    <div className="mt-5">
      <button
        type="button"
        className="btn btn-secondary"
        disabled={saved === null || busy}
        aria-pressed={saved === true}
        onClick={save}
      >
        <svg
          aria-hidden="true"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={saved ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="1.6"
        >
          <path d="M6 3h12v18l-6-4-6 4z" />
        </svg>
        {busy
          ? "Saving…"
          : saved === null
            ? "Checking saved status…"
            : saved
              ? "Saved · Remove"
              : "Save project"}
      </button>
      <span role="status" className="ml-3 text-sm text-muted">
        {saved === true && !busy ? "In your private collection" : ""}
      </span>
      {error && (
        <p role="alert" className="mt-3 text-sm text-red">
          {error}{" "}
          <button
            className="btn btn-secondary ml-2"
            onClick={() => setRetry((value) => value + 1)}
          >
            Retry
          </button>
        </p>
      )}
    </div>
  );
}
