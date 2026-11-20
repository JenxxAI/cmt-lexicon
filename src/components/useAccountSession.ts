"use client";

import { useSyncExternalStore } from "react";
import type { CommunitySession } from "@/lib/community-session";

// Display-only memory, shared across route remounts. Never persist credentials.
let session: CommunitySession | null | undefined;
const listeners = new Set<() => void>();
let disconnect: (() => void) | undefined;
let generation = 0;
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    const current = ++generation;
    void import("@/lib/supabase")
      .then(({ getCommunityClient }) => {
        if (current !== generation || !listeners.size) return;
        const { data } = getCommunityClient().auth.onAuthStateChange(
          (_event, value) => {
            session = value;
            listeners.forEach((notify) => notify());
          },
        );
        disconnect = () => data.subscription.unsubscribe();
      })
      .catch(() => {
        /* Keep the last verified display state on network failure. */
      });
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      generation++;
      disconnect?.();
      disconnect = undefined;
    }
  };
}
export function useAccountSession() {
  return useSyncExternalStore(
    subscribe,
    () => session,
    () => undefined,
  );
}
