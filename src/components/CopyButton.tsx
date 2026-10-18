"use client";

import { useEffect, useRef, useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";

type Props = {
  text: string;
  label?: string;
  variant?: "outline" | "solid" | "ghost";
  /** Show only the icon (the label is still the accessible name). */
  iconOnly?: boolean;
  className?: string;
  compactOnMobile?: boolean;
};

const VARIANTS = {
  outline: "border-ink bg-surface text-ink hover:bg-paper px-4 text-sm font-medium",
  solid: "border-transparent bg-accent text-white px-5 text-[15px] font-semibold hover:bg-accent-deep",
  ghost: "border-transparent text-rule hover:bg-ink px-3 text-sm",
} as const;

export function CopyButton({ text, label = "Copy prompt", variant = "outline", iconOnly = false, compactOnMobile = false, className = "" }: Props) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for insecure contexts or blocked clipboard access.
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
    }
    setCopied(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(false), 1500);
  }

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={iconOnly || compactOnMobile ? label : undefined}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border ${VARIANTS[variant]} ${iconOnly ? "min-w-11" : ""} ${compactOnMobile ? "max-sm:min-w-11 max-sm:px-0" : ""} ${className}`}
      >
        <Icon className="size-4" />
        {iconOnly ? null : <span className={compactOnMobile ? "max-sm:hidden" : undefined}>{copied ? "Copied" : label}</span>}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </>
  );
}
