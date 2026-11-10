"use client";

import { CheckIcon, CopyIcon } from "./icons";
import { COPY_FAILED_HINT, useCopyStatus } from "./useCopyStatus";

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
  outline: "border-transparent bg-line text-ink hover:bg-rule px-4 text-sm font-medium",
  solid: "border-transparent bg-ink text-white px-5 text-[15px] font-semibold hover:bg-body",
  ghost: "border-transparent text-rule hover:bg-ink px-3 text-sm",
} as const;

export function CopyButton({ text, label = "Copy prompt", variant = "outline", iconOnly = false, compactOnMobile = false, className = "" }: Props) {
  const [status, copy] = useCopyStatus();
  const copied = status === "copied";
  const failed = status === "failed";

  const Icon = copied ? CheckIcon : CopyIcon;

  return (
    <>
      <button
        type="button"
        onClick={() => void copy(text)}
        aria-label={iconOnly || compactOnMobile ? label : undefined}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-full border ${VARIANTS[variant]} ${iconOnly ? "min-w-11" : ""} ${compactOnMobile && !failed ? "max-sm:min-w-11 max-sm:px-0" : ""} ${className}`}
      >
        <Icon className="size-4" />
        {/* A failure is always shown as text, even on icon-only and compact buttons, so nobody is left guessing. */}
        {iconOnly && !failed ? null : (
          <span className={compactOnMobile && !failed ? "max-sm:hidden" : undefined}>
            {copied ? "Copied" : failed ? "Copy failed" : label}
          </span>
        )}
      </button>
      <span role="status" className="sr-only">
        {copied ? "Copied to clipboard" : ""}
      </span>
      <span role="alert" className="sr-only">
        {failed ? COPY_FAILED_HINT : ""}
      </span>
    </>
  );
}
