import { createHandler } from "./handler.ts";

// Keep this small Deno bootstrap typechecked by the app's tsc without a runtime dependency.
declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Promise<Response>): void;
};
const env = (key: string) => Deno.env.get(key) ?? "";
const required = (key: string) => {
  const value = env(key);
  if (!value) throw new Error("Missing server configuration");
  return value;
};
const origins = env("FEEDBACK_ALLOWED_ORIGINS")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

async function backend(path: string, init: RequestInit) {
  const secret =
    JSON.parse(env("SUPABASE_SECRET_KEYS") || "{}").default ||
    required("SUPABASE_SERVICE_ROLE_KEY");
  const headers = new Headers(init.headers);
  headers.set("apikey", secret);
  if (!secret.startsWith("sb_secret_"))
    headers.set("Authorization", `Bearer ${secret}`);
  return fetch(`${required("SUPABASE_URL")}${path}`, {
    ...init,
    headers,
    signal: AbortSignal.timeout(10000),
  });
}

Deno.serve(
  createHandler({
    origins,
    async verify(token, hostname) {
      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          body: new URLSearchParams({
            secret: required("TURNSTILE_SECRET_KEY"),
            response: token,
          }),
          signal: AbortSignal.timeout(10000),
        },
      );
      const result = await response.json();
      return (
        response.ok &&
        result.success === true &&
        result.hostname === hostname &&
        result.action === "feedback"
      );
    },
    async fingerprint(request) {
      // Network hints are supplemental; the global database quota is enforced regardless.
      const address =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "unknown";
      const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(required("FEEDBACK_HASH_SECRET")),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
      );
      const hash = await crypto.subtle.sign(
        "HMAC",
        key,
        new TextEncoder().encode(address),
      );
      return Array.from(new Uint8Array(hash), (byte) =>
        byte.toString(16).padStart(2, "0"),
      ).join("");
    },
    async save(feedback, fingerprint) {
      const response = await backend("/rest/v1/rpc/receive_feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          p_kind: feedback.kind,
          p_message: feedback.message,
          p_email: feedback.email,
          p_page: feedback.page,
          p_fingerprint: fingerprint,
        }),
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(
          result.message === "rate_limit" ? "rate_limit" : "save_failed",
        );
      }
      return (await response.json()) as string;
    },
    async attach(id, bytes, type) {
      const extension =
        type === "image/png" ? "png" : type === "image/jpeg" ? "jpg" : "webp";
      const path = `${id}.${extension}`;
      const uploaded = await backend(
        `/storage/v1/object/feedback-screenshots/${path}`,
        {
          method: "POST",
          headers: { "Content-Type": type },
          body: new Blob([new Uint8Array(bytes)], { type }),
        },
      );
      if (!uploaded.ok) throw new Error("upload_failed");
      const updated = await backend(`/rest/v1/feedback_inbox?id=eq.${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ screenshot_path: path }),
      });
      if (!updated.ok) {
        await backend(`/storage/v1/object/feedback-screenshots`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prefixes: [path] }),
        });
        throw new Error("attachment_failed");
      }
    },
    async notify(id, kind) {
      if (
        !env("RESEND_API_KEY") ||
        !env("FEEDBACK_EMAIL_TO") ||
        !env("FEEDBACK_EMAIL_FROM")
      )
        return;
      const project = new URL(required("SUPABASE_URL")).hostname.split(".")[0];
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${env("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `feedback/${id}`,
        },
        body: JSON.stringify({
          from: env("FEEDBACK_EMAIL_FROM"),
          to: [env("FEEDBACK_EMAIL_TO")],
          subject: `UI Lexicon: new ${kind}`,
          text: `A new private report was saved.\nReference: ${id}\nOpen the feedback_inbox table:\nhttps://supabase.com/dashboard/project/${project}/editor\n\nVisitor messages and screenshots are not included in email.`,
        }),
      });
      const status = response.ok ? "sent" : "failed";
      await backend(`/rest/v1/feedback_inbox?id=eq.${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_status: status }),
      });
      if (!response.ok) throw new Error("mail_failed");
    },
  }),
);
