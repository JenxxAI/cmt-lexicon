"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { copyText } from "../lib/clipboard";

export type CopyStatus = "idle" | "copied" | "failed";

const COPIED_MS = 1500;
/** Failures stay up longer: the person needs time to read what to do instead. */
const FAILED_MS = 4000;

/** Copy state for a button: `copied` only after a real copy, `failed` when nothing was copied. */
export function useCopyStatus() {
  const [status, setStatus] = useState<CopyStatus>("idle");
  const timer = useRef<number | undefined>(undefined);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      window.clearTimeout(timer.current);
    };
  }, []);

  const copy = useCallback(async (text: string) => {
    const ok = await copyText(text);
    if (!mounted.current) return;
    setStatus(ok ? "copied" : "failed");
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus("idle"), ok ? COPIED_MS : FAILED_MS);
  }, []);

  return [status, copy] as const;
}

export const COPY_FAILED_HINT = "Copy failed. Select the text and copy it manually.";
