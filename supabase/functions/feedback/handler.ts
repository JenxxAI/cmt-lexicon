import {
  MAX_REQUEST_BYTES,
  MAX_SCREENSHOT_BYTES,
  screenshotType,
  validateFeedback,
  type Feedback,
} from "./validation.ts";

export type Dependencies = {
  origins: string[];
  verify: (token: string, hostname: string) => Promise<boolean>;
  fingerprint: (request: Request) => Promise<string>;
  save: (feedback: Feedback, fingerprint: string) => Promise<string>;
  attach: (id: string, bytes: Uint8Array, type: string) => Promise<void>;
  notify: (id: string, kind: string) => Promise<void>;
};

export function createHandler(deps: Dependencies) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get("origin") ?? "";
    const headers = {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Headers": "content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      Vary: "Origin",
      "Cache-Control": "no-store",
    };
    const reply = (status: number, body: object) =>
      Response.json(body, { status, headers });
    if (!deps.origins.includes(origin))
      return new Response("Forbidden", { status: 403 });
    if (request.method === "OPTIONS")
      return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply(405, { error: "Use POST." });
    if (
      !request.headers.get("content-type")?.startsWith("multipart/form-data;")
    )
      return reply(415, { error: "Use the feedback form." });
    try {
      // Read with a hard streaming cap: Content-Length can be missing or forged.
      const reader = request.body?.getReader();
      if (!reader) return reply(400, { error: "Missing feedback." });
      const chunks: Uint8Array[] = [];
      let length = 0;
      while (true) {
        const part = await reader.read();
        if (part.done) break;
        length += part.value.length;
        if (length > MAX_REQUEST_BYTES) {
          await reader.cancel();
          return reply(413, { error: "Screenshot must be 3 MB or smaller." });
        }
        chunks.push(part.value);
      }
      const body = new Uint8Array(length);
      let offset = 0;
      for (const chunk of chunks) {
        body.set(chunk, offset);
        offset += chunk.length;
      }
      const data = await new Response(body, {
        headers: { "Content-Type": request.headers.get("content-type")! },
      }).formData();
      const field = (name: string) =>
        typeof data.get(name) === "string" ? String(data.get(name)).trim() : "";
      if (field("website")) return reply(400, { error: "Please try again." });
      const feedback = {
        kind: field("kind"),
        message: field("message"),
        email: field("email"),
        page: field("page"),
      };
      const invalid = validateFeedback(feedback);
      if (invalid) return reply(400, { error: invalid });
      const token = field("token");
      if (
        !token ||
        token.length > 2048 ||
        !(await deps.verify(token, new URL(origin).hostname))
      )
        return reply(400, {
          error: "Please complete the security check again.",
        });
      const file = data.get("screenshot");
      let bytes: Uint8Array | undefined;
      let type: string | null = null;
      if (file instanceof File && file.size) {
        if (file.size > MAX_SCREENSHOT_BYTES)
          return reply(413, { error: "Screenshot must be 3 MB or smaller." });
        bytes = new Uint8Array(await file.arrayBuffer());
        type = screenshotType(bytes);
        if (!type || type !== file.type)
          return reply(400, {
            error: "Attach a PNG, JPEG, or WebP screenshot.",
          });
      }
      const id = await deps.save(feedback, await deps.fingerprint(request));
      let attachmentSaved = true;
      if (bytes && type) {
        try {
          await deps.attach(id, bytes, type);
        } catch {
          attachmentSaved = false;
          console.error("Feedback attachment failed", id);
        }
      }
      // A mail outage must never turn a saved report into an apparent failed submission.
      try {
        await deps.notify(id, feedback.kind);
      } catch {
        console.error("Feedback notification failed", id);
      }
      return reply(200, { ok: true, attachmentSaved });
    } catch (error) {
      if (error instanceof Error && error.message === "rate_limit")
        return reply(429, {
          error: "The feedback limit was reached. Please try again later.",
        });
      console.error("Feedback submission failed");
      return reply(503, {
        error:
          "Feedback could not be saved. Please try again later or use GitHub.",
      });
    }
  };
}
