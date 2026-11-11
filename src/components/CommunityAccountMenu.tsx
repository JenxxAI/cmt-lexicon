"use client";

import "./account-menu.css";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

export function CommunityAccountMenu({
  handle,
  avatar,
  signOutDisabled,
  onSignOut,
}: {
  handle: string;
  avatar: unknown;
  signOutDisabled?: boolean;
  onSignOut?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [failedImage, setFailedImage] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const name = handle ? `@${handle}` : "GitHub account";
  const image =
    typeof avatar === "string" &&
    avatar.startsWith("https://avatars.githubusercontent.com/")
      ? avatar
      : "";
  useEffect(() => {
    if (!open) return;
    function dismiss(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", dismiss);
    return () => document.removeEventListener("pointerdown", dismiss);
  }, [open]);
  function close() {
    setOpen(false);
    trigger.current?.focus();
  }
  return (
    <div
      ref={container}
      className="relative min-w-0"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onKeyDown={(event) => {
        if (open && event.key === "Escape") {
          event.preventDefault();
          close();
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        data-auth-trigger
        className="account-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`Account menu for ${name}`}
        onClick={() => setOpen(!open)}
      >
        <span aria-hidden="true" className="account-avatar">
          {image && failedImage !== image ? (
            <img
              src={image}
              alt=""
              width={32}
              height={32}
              referrerPolicy="no-referrer"
              onError={() => setFailedImage(image)}
            />
          ) : (
            handle.slice(0, 2).toUpperCase() || "GH"
          )}
        </span>
      </button>
      <div hidden={!open} id={panelId} className="account-panel">
        <p className="px-3 pb-2 text-xs text-muted">
          Signed in with GitHub
          <strong className="block break-all text-sm text-ink">{name}</strong>
        </p>
        <Link href="/community/mine/" onClick={() => setOpen(false)}>
          My submissions
        </Link>
        {onSignOut ? (
          <button
            type="button"
            disabled={signOutDisabled}
            onClick={() => {
              close();
              onSignOut();
            }}
          >
            Sign out
          </button>
        ) : (
          <Link href="/community/auth/" onClick={() => setOpen(false)}>
            Manage account
          </Link>
        )}
      </div>
    </div>
  );
}
