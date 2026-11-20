"use client";

import { CommunityAccountMenu } from "./CommunityAccountMenu";
import { GitHubIcon } from "./GitHubIcon";
import Link from "next/link";
import { useAccountSession } from "./useAccountSession";
import { displayName } from "@/lib/community-ui";

// Session state is only a display hint; protected data remains behind RLS.
export function HeaderAccount() {
  const session = useAccountSession();
  if (session === undefined)
    return (
      <span
        className="account-placeholder"
        role="status"
        aria-label="Checking account"
      >
        <span className="sr-only">Checking account…</span>
      </span>
    );
  const handle = session ? displayName(session.user) : "";
  return session ? (
    <CommunityAccountMenu
      handle={handle}
      avatar={session.user.user_metadata.avatar_url}
    />
  ) : (
    <Link href="/community/auth/" className="site-sign-in" data-auth-trigger>
      <GitHubIcon size={18} /> Sign in
    </Link>
  );
}
