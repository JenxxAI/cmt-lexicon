"use client";

import { useEffect, useId, useRef } from "react";
import { dialogCopy, type AuthDialogState } from "@/lib/community-ui";
import { GitHubIcon } from "./GitHubIcon";
import { Spinner } from "./Spinner";

export function AuthDialog({
  state,
  pending,
  onClose,
  onSignOut,
  onRetry,
}: {
  state: AuthDialogState | null;
  pending: boolean;
  onClose: () => void;
  onSignOut: () => void;
  onRetry: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const restoreWhenReady = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const open = state !== null;
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    restoreWhenReady.current = false;
    const trigger = document.activeElement;
    element.showModal();
    return () => {
      element.close();
      const target =
        trigger instanceof HTMLElement &&
        trigger !== document.body &&
        trigger.isConnected &&
        !trigger.matches(":disabled")
          ? trigger
          : document.querySelector<HTMLElement>(
              "[data-auth-trigger]:not(:disabled)",
            );
      target?.focus();
      restoreWhenReady.current = !target;
    };
  }, [open]);
  // Escape can close the notice while its trigger is still disabled by the request.
  useEffect(() => {
    if (
      open ||
      !restoreWhenReady.current ||
      document.activeElement !== document.body
    )
      return;
    const target = document.querySelector<HTMLElement>(
      "[data-auth-trigger]:not(:disabled)",
    );
    if (target) {
      target.focus();
      restoreWhenReady.current = false;
    }
  });
  if (!state) return null;
  const signingOut = pending && state.kind === "confirm-sign-out";
  const copy = signingOut
    ? {
        title: "Signing out…",
        description:
          "Finishing your session securely. Your saved local draft stays here.",
      }
    : dialogCopy(state);
  const success = state.kind === "signed-in" || state.kind === "signed-out";
  return (
    <dialog
      ref={dialog}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="community-dialog m-auto rounded-[28px] bg-surface p-6 text-ink"
      onCancel={(event) => {
        event.preventDefault();
        if (!signingOut) onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = dialog.current?.querySelectorAll<HTMLButtonElement>(
          "button:not(:disabled)",
        );
        if (!controls?.length) return;
        const first = controls[0],
          last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
    >
      <div
        key={state.kind}
        className="auth-feedback"
        data-tone={
          success ? "success" : state.kind === "error" ? "error" : "neutral"
        }
      >
        <div className="auth-emblem" aria-hidden="true">
          {success ? (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path className="auth-check" d="m5 12 4 4L19 6" />
            </svg>
          ) : state.kind === "error" ? (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v6m0 4h.01" />
            </svg>
          ) : (
            <GitHubIcon size={28} />
          )}
        </div>
        <p className="auth-eyebrow">
          {success
            ? "All set"
            : state.kind === "error"
              ? "Let's try that again"
              : "Your account"}
        </p>
        <h2 id={titleId} className="font-display text-2xl font-bold">
          {copy.title}
        </h2>
        <p id={descriptionId} className="mt-3 text-body">
          {copy.description}
        </p>
      </div>
      <span
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {copy.title}
      </span>
      {state.kind === "redirecting" && (
        <p role="status" className="mt-4 flex items-center gap-2">
          <Spinner /> Opening GitHub…
        </p>
      )}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          autoFocus
          type="button"
          className="btn btn-secondary"
          onClick={onClose}
          disabled={signingOut}
        >
          {state.kind === "confirm-sign-out"
            ? "Stay signed in"
            : success
              ? "Continue"
              : "Close"}
        </button>
        {state.kind === "confirm-sign-out" && (
          <button
            type="button"
            className="btn btn-primary"
            disabled={pending}
            aria-busy={pending}
            onClick={onSignOut}
          >
            {pending && <Spinner />}
            {pending ? "Signing out…" : "Sign out"}
          </button>
        )}
        {state.kind === "error" && (
          <button type="button" className="btn btn-primary" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    </dialog>
  );
}
