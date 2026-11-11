"use client";
import { useEffect, useRef, useState } from "react";
import { THEME_KEY, themePreference, type ThemePreference } from "@/lib/theme";
export function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [preference, setPreference] = useState<ThemePreference>("system");
  const control = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (!control.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    let current: ThemePreference = "system";
    function apply() {
      document.documentElement.dataset.theme =
        current === "dark" || (current === "system" && media.matches)
          ? "dark"
          : "light";
      setPreference(current);
    }
    try {
      current = themePreference(localStorage.getItem(THEME_KEY));
    } catch {}
    apply();
    function storage(event: StorageEvent) {
      if (event.key !== THEME_KEY && event.key !== null) return;
      current = themePreference(event.newValue);
      apply();
    }
    function change(event: Event) {
      current = themePreference((event as CustomEvent).detail);
      apply();
    }
    window.addEventListener("storage", storage);
    window.addEventListener("ui-lexicon-theme-change", change);
    media.addEventListener("change", apply);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener("ui-lexicon-theme-change", change);
      media.removeEventListener("change", apply);
    };
  }, []);
  return (
    <div
      className="theme-control"
      ref={control}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          setOpen(false);
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="theme-trigger"
        aria-label={`Color theme: ${preference}`}
        aria-expanded={open}
        aria-controls="theme-options"
        title="Choose color theme"
        onClick={() => setOpen(!open)}
      >
        <ThemeIcon key={preference} theme={preference} />
      </button>
      <div id="theme-options" className="theme-options" hidden={!open}>
        <p>Appearance</p>
        {(["light", "dark", "system"] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={preference === option}
            onClick={() => {
              try {
                localStorage.setItem(THEME_KEY, option);
              } catch {}
              window.dispatchEvent(
                new CustomEvent("ui-lexicon-theme-change", { detail: option }),
              );
              setOpen(false);
              trigger.current?.focus();
            }}
          >
            <ThemeIcon theme={option} />
            <span>
              {option === "system"
                ? "Use device setting"
                : option === "dark"
                  ? "Dark"
                  : "Light"}
            </span>
            <span aria-hidden="true" className="theme-check">
              {preference === option ? "✓" : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
function ThemeIcon({ theme }: { theme: ThemePreference }) {
  return (
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
      {theme === "light" ? (
        <>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5" />
        </>
      ) : theme === "dark" ? (
        <path d="M20.5 14A9 9 0 0 1 10 3.5 9 9 0 1 0 20.5 14Z" />
      ) : (
        <>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8m-4-4v4" />
        </>
      )}
    </svg>
  );
}
