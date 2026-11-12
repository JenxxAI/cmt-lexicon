"use client";

import { useEffect, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { PREVIEW_BUCKET, isPreviewPath } from "@/lib/community-previews";

const TTL_SECONDS = 3600;
/**
 * Preview images sit in a private bucket whose read policy follows the project's status, so the
 * browser needs short-lived signed URLs. One batched request covers a whole page of projects.
 * A failure just leaves the card text-only; it never blocks the list.
 */
export function useSignedPreviewUrls(
  client: SupabaseClient | null,
  paths: string[],
) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const key = [...new Set(paths.filter(isPreviewPath))].sort().join("|");
  useEffect(() => {
    if (!client || !key) return;
    let alive = true;
    Promise.resolve(
      client.storage.from(PREVIEW_BUCKET).createSignedUrls(key.split("|"), TTL_SECONDS),
    )
      .then(({ data }) => {
        if (!alive || !data) return;
        const next: Record<string, string> = {};
        for (const item of data)
          if (item.path && item.signedUrl && !item.error) next[item.path] = item.signedUrl;
        setUrls((old) => ({ ...old, ...next }));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [client, key]);
  return urls;
}
