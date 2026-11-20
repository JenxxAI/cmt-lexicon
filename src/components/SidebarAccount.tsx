"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useAccountSession } from "./useAccountSession";
import { AuthDialog } from "./AuthDialog";
import type { AuthDialogState } from "@/lib/community-ui";
import {
  communityError,
  PRESERVE_DRAFT_EVENT,
} from "@/lib/community-resilience";
import "./community-ui.css";

export function SidebarAccount({
  compact = false,
  onOpen,
}: {
  compact?: boolean;
  onOpen?: () => void;
}) {
  const session = useAccountSession();
  const [dialog, setDialog] = useState<AuthDialogState | null>(null);
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function signOut() {
    if (pending.current) return;
    if (
      !window.dispatchEvent(
        new Event(PRESERVE_DRAFT_EVENT, { cancelable: true }),
      )
    ) {
      setDialog({
        kind: "error",
        retry: "out",
        detail:
          "Your draft could not be saved. Export your code before signing out.",
      });
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const { getCommunityClient } = await import("@/lib/supabase");
      const result = await getCommunityClient().auth.signOut();
      if (result.error) throw result.error;
      setDialog({ kind: "signed-out" });
    } catch (error) {
      setDialog({
        kind: "error",
        retry: "out",
        detail: communityError(error, !navigator.onLine),
      });
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <div className="sidebar-account community-ui">
      {session && (
        <button
          type="button"
          className="sidebar-sign-out"
          aria-label="Sign out"
          title={compact ? "Sign out" : undefined}
          disabled={busy}
          data-auth-trigger
          onClick={() => {
            onOpen?.();
            setDialog({ kind: "confirm-sign-out" });
          }}
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 4H4v16h5M9 12h12m-4-4 4 4-4 4" />
          </svg>
          {!compact && <span>Sign out</span>}
        </button>
      )}
      {dialog &&
        createPortal(
          <div className="community-ui">
            <AuthDialog
              state={dialog}
              pending={busy}
              onClose={() => setDialog(null)}
              onSignOut={signOut}
              onRetry={() => setDialog({ kind: "confirm-sign-out" })}
            />
          </div>,
          document.body,
        )}
    </div>
  );
}
