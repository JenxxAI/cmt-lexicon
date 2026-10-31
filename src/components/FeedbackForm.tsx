"use client";

import Script from "next/script";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { SITE } from "@/lib/site";

type Turnstile = {
  render: (element: HTMLElement, options: Record<string, unknown>) => string;
  remove: (id: string) => void;
};
const sitekey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const enabled =
  process.env.NEXT_PUBLIC_FEEDBACK_ENABLED === "true" &&
  !!sitekey &&
  !!supabaseUrl;
const fieldClass =
  "mt-2 w-full min-w-0 rounded-2xl border border-rule bg-paper px-4 py-3 text-base text-ink";

export function FeedbackForm() {
  const [kind, setKind] = useState("feedback");
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [token, setToken] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const challenge = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const api = (window as Window & { turnstile?: Turnstile }).turnstile;
    if (!enabled || !active || !scriptReady || !api || !challenge.current)
      return;
    const id = api.render(challenge.current, {
      sitekey,
      action: "feedback",
      theme: "light",
      size: "flexible",
      callback: (value: string) => {
        setToken(value);
        setError("");
      },
      "expired-callback": () => setToken(""),
      "error-callback": () => {
        setToken("");
        setError(
          "The security check could not load. Try again or report on GitHub.",
        );
      },
    });
    return () => api.remove(id);
  }, [active, scriptReady, attempt]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enabled || pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const screenshot = data.get("screenshot");
    if (screenshot instanceof File && screenshot.size > 3 * 1024 * 1024) {
      setError("Screenshot must be 3 MB or smaller.");
      return;
    }
    if (message.trim().length < 10) {
      setError(
        "Please write at least 10 characters so we can understand your feedback.",
      );
      return;
    }
    if (!token) {
      setError("Please complete the security check before sending.");
      return;
    }
    data.set("token", token);
    data.set("page", window.location.pathname);
    setPending(true);
    setError("");
    setSuccess("");
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/feedback`, {
        method: "POST",
        body: data,
        signal: AbortSignal.timeout(90000),
      });
      const result = await response.json();
      if (!response.ok || result.ok !== true)
        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Feedback could not be saved. Please try again.",
        );
      setSuccess(
        result.attachmentSaved === false
          ? "Your feedback was saved, but the screenshot could not be attached. Thank you for helping us improve."
          : "Thanks for helping UI Lexicon grow. Your feedback has been sent privately.",
      );
      form.reset();
      setMessage("");
      setKind("feedback");
    } catch (cause) {
      setError(
        cause instanceof Error &&
          cause.name !== "TypeError" &&
          cause.name !== "TimeoutError"
          ? cause.message
          : "We could not confirm delivery. Please try again later or report on GitHub.",
      );
    } finally {
      setPending(false);
      setToken("");
      setAttempt((value) => value + 1);
    }
  }

  return (
    <section
      id="feedback"
      aria-labelledby="feedback-heading"
      className="mb-12 scroll-mt-6 rounded-[28px] bg-surface p-5 sm:p-8 lg:p-10"
    >
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
        <div>
          <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 font-mono text-xs text-accent-deep">
            Made better together
          </span>
          <h2
            id="feedback-heading"
            className="mt-5 max-w-sm font-display text-3xl font-bold leading-tight sm:text-4xl"
          >
            Found a bug?
            <br />
            Have an idea?
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            A confusing label, a missing component, or something that just won’t
            click. We’d love to hear about it.
          </p>
          <p className="mt-5 text-sm text-muted">
            No account needed. Feedback stays private.
          </p>
          <a
            href={`${SITE.repoUrl}/issues/new`}
            className="mt-3 inline-flex min-h-11 items-center rounded-sm text-sm underline underline-offset-4 hover:text-accent-deep"
          >
            Prefer GitHub? Open an issue
          </a>
        </div>
        <form
          onSubmit={submit}
          onFocus={() => setActive(true)}
          className="min-w-0"
          aria-label="Send private feedback"
        >
          <fieldset disabled={pending}>
            <legend className="text-sm font-semibold">
              What’s on your mind?
            </legend>
            <div className="mt-3 flex flex-wrap gap-2">
              {[
                ["bug", "Report a bug"],
                ["feedback", "Share feedback"],
                ["idea", "Suggest a component"],
              ].map(([value, label]) => (
                <label key={value} className="relative cursor-pointer">
                  <input
                    className="peer sr-only"
                    type="radio"
                    name="kind"
                    value={value}
                    checked={kind === value}
                    onChange={() => setKind(value)}
                  />
                  <span className="flex min-h-11 items-center rounded-xl border border-rule bg-paper px-3 py-2 text-sm font-medium peer-checked:border-ink peer-checked:bg-ink peer-checked:text-surface peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-deep">
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <label
              className="mt-5 block text-sm font-semibold"
              htmlFor="feedback-message"
            >
              Your message{" "}
              <span className="font-normal text-muted">(required)</span>
            </label>
            <textarea
              id="feedback-message"
              name="message"
              required
              minLength={10}
              maxLength={4000}
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={
                kind === "bug"
                  ? "What happened, and what did you expect?"
                  : "Tell us what would make UI Lexicon more useful…"
              }
              aria-describedby="feedback-message-help"
              className={`${fieldClass} resize-y`}
            />
            <p id="feedback-message-help" className="mt-1 text-xs text-muted">
              10–4,000 characters. Please don’t include passwords or private
              keys.
            </p>
            <label
              className="mt-4 block text-sm font-semibold"
              htmlFor="feedback-email"
            >
              Email{" "}
              <span className="font-normal text-muted">
                (optional, for a reply)
              </span>
            </label>
            <input
              id="feedback-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={254}
              placeholder="you@example.com"
              className={fieldClass}
            />
            <label
              className="mt-4 block text-sm font-semibold"
              htmlFor="feedback-screenshot"
            >
              Screenshot{" "}
              <span className="font-normal text-muted">(optional)</span>
            </label>
            <input
              id="feedback-screenshot"
              name="screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-describedby="feedback-file-help"
              className="mt-2 min-h-11 w-full min-w-0 max-w-full rounded-sm text-sm text-muted file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-paper file:px-3 file:text-ink"
            />
            <p id="feedback-file-help" className="mt-1 text-xs text-muted">
              PNG, JPEG, or WebP · 3 MB max. Hide any personal information
              first.
            </p>
            <div className="hidden" aria-hidden="true">
              <label>
                Website
                <input name="website" tabIndex={-1} autoComplete="off" />
              </label>
            </div>
          </fieldset>
          {enabled && active && (
            <>
              <Script
                src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
                onReady={() => setScriptReady(true)}
                onError={() =>
                  setError(
                    "The security check could not load. Please use GitHub instead.",
                  )
                }
              />
              <div ref={challenge} className="mt-4 min-h-16" />
            </>
          )}
          {!enabled && (
            <p className="mt-4 rounded-xl bg-paper p-3 text-sm text-muted">
              Private feedback is being set up. For now, please use the GitHub
              issue link.
            </p>
          )}
          <p role="alert" className="mt-3 text-sm text-red">
            {error}
          </p>
          <p role="status" className="text-sm text-green">
            {success}
          </p>
          <button
            type="submit"
            disabled={!enabled || pending}
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-semibold text-surface disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send feedback"}
          </button>
          <p className="mt-3 text-xs leading-relaxed text-muted">
            Your message, optional email and screenshot, and this page’s path go
            to the site owner. Spam checks use Cloudflare Turnstile when this
            form is enabled.
          </p>
        </form>
      </div>
    </section>
  );
}
