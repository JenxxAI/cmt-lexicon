"use client";

import { useState } from "react";
import { estimateTokens } from "@/lib/tokens";
import { CopyButton } from "./CopyButton";

type Mode = "short" | "detailed";

export function PromptPanel({ short, detailed }: { short: string; detailed: string }) {
  const [mode, setMode] = useState<Mode>("short");
  const text = mode === "short" ? short : detailed;
  const otherLabel = mode === "short" ? "Detailed" : "Short";
  const otherText = mode === "short" ? detailed : short;

  return (
    <section aria-labelledby="prompt-heading" className="rounded-[18px] border border-rule bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="prompt-heading" className="font-mono text-[13px] font-normal uppercase tracking-wide text-muted">
          Prompt
        </h2>
        <div role="group" aria-label="Prompt length" className="flex gap-1 rounded-xl bg-paper p-1">
          {(["short", "detailed"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              onClick={() => setMode(option)}
              className={`min-h-11 rounded-[9px] px-4 text-sm capitalize ${
                mode === option ? "bg-ink font-semibold text-white" : "font-medium text-muted hover:text-ink"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>

      <p className="mt-3 rounded-xl bg-paper p-4 font-mono text-[15px] leading-relaxed">{text}</p>

      <div className="mt-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="rounded-lg bg-hi px-2.5 py-1 font-mono text-xs font-medium">
            ~{estimateTokens(text)} tokens
          </span>
          <span className="text-[13px] text-muted">
            {otherLabel} is ~{estimateTokens(otherText)}
          </span>
        </div>
        <CopyButton text={text} variant="solid" />
      </div>
    </section>
  );
}
