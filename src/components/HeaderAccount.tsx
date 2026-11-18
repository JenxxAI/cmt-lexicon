"use client";

import { CommunityAccountMenu } from "./CommunityAccountMenu";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { CommunitySession as Session } from "@/lib/community-session";
import { displayName } from "@/lib/community-ui";

// Session state is only a display hint; protected data remains behind RLS.
export function HeaderAccount() {
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    let alive = true;
    let unsubscribe: (() => void) | undefined;
    // Load only the session display adapter; credentials stay HttpOnly.
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
    <CommunityAccountMenu
      handle={handle}
      avatar={session.user.user_metadata.avatar_url}
    />
  ) : (
    <Link href="/community/auth/" className="site-sign-in">
      Sign in
    </Link>
  );
}
