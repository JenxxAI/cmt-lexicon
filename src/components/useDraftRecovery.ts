"use client";
import {
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { CommunityDraft } from "@/lib/community";
import {
  DRAFT_KEY,
  PRESERVE_DRAFT_EVENT,
  parseLocalDraft,
  shouldRestoreDraft,
  writeLocalDraft,
} from "@/lib/community-resilience";

export function useDraftRecovery(
  draft: CommunityDraft,
  setDraft: Dispatch<SetStateAction<CommunityDraft>>,
  setTags: Dispatch<SetStateAction<string>>,
) {
  const latest = useRef(draft);
  latest.current = draft;
  const dirty = useRef(false);
  const [unsaved, setUnsaved] = useState(false);
  const restoredRemix = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [saveStatus, setSaveStatus] = useState(
    "Drafts stay in this browser. Do not include secrets on a shared device.",
  );
  const flush = useRef<(force?: boolean) => boolean>(() => true);
  flush.current = (force = false) => {
    if (!force && !dirty.current) return true;
    try {
      writeLocalDraft(localStorage, latest.current);
      setSaveStatus("Draft saved in this browser. It has not been submitted.");
      dirty.current = false;
      setUnsaved(false);
      return true;
    } catch {
      setSaveStatus(
        "Local saving is unavailable or the draft exceeds the limit. Keep this tab open. Reduce oversized code, or copy/export your work before leaving.",
      );
      return false;
    }
  };
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const remix = new URL(window.location.href).searchParams.get("remix");
      const restored = raw ? parseLocalDraft(raw) : null;
      if (restored && shouldRestoreDraft(restored, remix)) {
        restoredRemix.current = restored.remixOf;
        setDraft(restored);
        setTags(restored.tags.join(", "));
        setSaveStatus(
          "Your local draft was restored. Confirm the sharing license before submitting.",
        );
      }
    } catch {
      setSaveStatus(
        "Your local draft could not be restored. Local saving may be unavailable; export your work before leaving.",
      );
    }
    setReady(true);
    const preserve = (event: Event) => {
      if (!flush.current()) event.preventDefault();
    };
    const leave = (event: BeforeUnloadEvent) => {
      if (!flush.current()) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    const hide = () => {
      flush.current();
    };
    window.addEventListener(PRESERVE_DRAFT_EVENT, preserve);
    window.addEventListener("beforeunload", leave);
    window.addEventListener("pagehide", hide);
    return () => {
      flush.current();
      window.removeEventListener(PRESERVE_DRAFT_EVENT, preserve);
      window.removeEventListener("beforeunload", leave);
      window.removeEventListener("pagehide", hide);
    };
  }, [setDraft, setTags]);
  useEffect(() => {
    if (!ready || !dirty.current) return;
    setSaveStatus("Saving your draft in this browser…");
    const timer = setTimeout(() => flush.current(), 500);
    return () => clearTimeout(timer);
  }, [draft, ready]);
  return {
    saveStatus,
    restoredRemix,
    unsaved,
    saveNow() {
      flush.current(true);
    },
    markRestored() {
      dirty.current = false;
      setUnsaved(false);
      setSaveStatus("Your saved draft was restored.");
    },
    markDirty() {
      dirty.current = true;
      setUnsaved(true);
    },
    forget() {
      try {
        localStorage.removeItem(DRAFT_KEY);
        setUnsaved(true);
        dirty.current = false;
        setSaveStatus(
          "Saved copy removed. Current edits remain here; further edits will be saved again.",
        );
      } catch {
        setSaveStatus(
          "Could not remove the saved copy. Check your browser storage settings.",
        );
      }
    },
  };
}
