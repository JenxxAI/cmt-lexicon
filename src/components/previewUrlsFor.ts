import { withBasePath } from "@/lib/base-path";
import { isPreviewPath } from "@/lib/community-previews";
import type { CommunityClient } from "@/lib/supabase";

// Each image request uses current RLS permissions, including after logout.
export function previewUrlsFor(
  client: CommunityClient | null,
  paths: string[],
): Record<string, string> {
  return Object.fromEntries(
    (client ? paths : [])
      .filter(isPreviewPath)
      .map((path) => [
        path,
        withBasePath("/api/community/image/?") + new URLSearchParams({ path }),
      ]),
  );
}
