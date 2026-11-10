"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { displayName } from "@/lib/community-ui";

// Session state is only a display hint; protected data remains behind RLS.
export function HeaderAccount() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    // Keep the auth SDK out of the glossary's initial JavaScript bundle.
    import("@/lib/supabase")
      .then(({ getCommunityClient }) => {
        if (!alive) return;
        const client = getCommunityClient();
        if (!client) return;
        const { data } = client.auth.onAuthStateChange((_event, value) => {
          if (alive) setSession(value);
        });
        unsubscribe = () => data.subscription.unsubscribe();
      })
      .catch(() => {
        /* The glossary still works if auth cannot initialize. */
      });
    return () => {
      alive = false;
      unsubscribe?.();
    };
  }, []);
  const handle = session ? displayName(session.user) : "";
  return session ? (
    <Link
      href="/community/mine/"
      className="site-profile"
      aria-label={handle ? `My submissions for @${handle}` : "My submissions"}
    >
      <span className="site-avatar" aria-hidden="true">
        {handle.slice(0, 2).toUpperCase() || "GH"}
      </span>
      <span className="site-handle">
        {handle ? `@${handle}` : "My account"}
      </span>
    </Link>
  ) : (
    <Link href="/community/auth/" className="site-sign-in">
      Sign in
    </Link>
  );
}
