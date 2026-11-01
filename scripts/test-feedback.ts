import assert from "node:assert/strict";
import {
  validateFeedback,
  screenshotType,
  MAX_SCREENSHOT_BYTES,
} from "../supabase/functions/feedback/validation";

const valid = {
  kind: "bug",
  message: "The copy button is not working.",
  email: "",
  page: "/assets/",
};
assert.equal(validateFeedback(valid), null);
assert.match(validateFeedback({ ...valid, message: "  " })!, /10/);
assert.match(
  validateFeedback({ ...valid, message: "x".repeat(4001) })!,
  /4000/,
);
assert.match(
  validateFeedback({ ...valid, email: "bad\r\n@example.com" })!,
  /email/,
);
assert.match(validateFeedback({ ...valid, kind: "spam" })!, /type/);
assert.match(validateFeedback({ ...valid, page: "/?token=secret" })!, /page/);
assert.equal(screenshotType(new TextEncoder().encode("<svg>bad</svg>")), null);
assert.equal(
  screenshotType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])),
  "image/png",
);
assert.equal(MAX_SCREENSHOT_BYTES, 3 * 1024 * 1024);
console.log("Feedback input checks passed.");

import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  createHandler,
  type Dependencies,
} from "../supabase/functions/feedback/handler";

async function main() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    alter default privileges in schema public grant all on tables to anon, authenticated;
    alter default privileges in schema public grant execute on functions to anon, authenticated;
    create schema storage;
    create table storage.buckets(id text, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);`);
  await db.exec(
    readFileSync(
      "supabase/migrations/20261031015512_footer_feedback.sql",
      "utf8",
    ),
  );
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    await assert.rejects(
      db.query("select * from public.feedback_inbox"),
      /permission denied/,
    );
    await assert.rejects(
      db.query(
        "select public.receive_feedback('bug','A valid report','','/',repeat('a',64))",
      ),
      /permission denied/,
    );
    await assert.rejects(
      db.query(
        "insert into public.feedback_inbox(kind,message,page,fingerprint) values('bug','A valid report','/',repeat('a',64))",
      ),
      /permission denied/,
    );
    await db.exec("reset role");
  }
  await db.exec("set role service_role");
  const save = (fingerprint = "a".repeat(64)) =>
    db.query(
      "select public.receive_feedback('bug','A valid report','','/',$1)",
      [fingerprint],
    );
  for (let i = 0; i < 5; i++) await save();
  await assert.rejects(save(), /rate_limit/);
  for (let i = 0; i < 45; i++) await save(i.toString(16).padStart(64, "0"));
  await assert.rejects(save("b".repeat(64)), /rate_limit/);
  await db.exec(
    "update public.feedback_inbox set created_at = now() - interval '25 hours'",
  );
  await save();
  await db.close();

  let saved = 0,
    attached = 0,
    notified = 0;
  const deps: Dependencies = {
    origins: ["https://example.com"],
    verify: async () => true,
    fingerprint: async () => "a".repeat(64),
    save: async () => {
      saved++;
      return "report-id";
    },
    attach: async () => {
      attached++;
    },
    notify: async () => {
      notified++;
    },
  };
  function request(
    extra: Record<string, string | Blob> = {},
    origin = "https://example.com",
  ) {
    const data = new FormData();
    for (const [key, value] of Object.entries({
      ...valid,
      token: "verified",
      ...extra,
    }))
      data.set(key, value);
    return new Request("https://backend.test/feedback", {
      method: "POST",
      headers: { origin },
      body: data,
    });
  }
  assert.equal(
    (await createHandler(deps)(request({}, "https://evil.test"))).status,
    403,
  );
  assert.equal(
    (await createHandler({ ...deps, verify: async () => false })(request()))
      .status,
    400,
  );
  assert.equal(
    (await createHandler(deps)(request({ website: "bot" }))).status,
    400,
  );
  assert.equal(saved, 0);
  assert.equal(
    (
      await createHandler(deps)(
        request({ screenshot: new Blob(["<svg/>"], { type: "image/png" }) }),
      )
    ).status,
    400,
  );
  assert.equal(saved, 0);
  const png = new Blob([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], {
    type: "image/png",
  });
  assert.equal(
    (await createHandler(deps)(request({ screenshot: png }))).status,
    200,
  );
  assert.equal(saved, 1);
  assert.equal(attached, 1);
  assert.equal(notified, 1);
  const failedMail = await createHandler({
    ...deps,
    notify: async () => {
      throw new Error("offline");
    },
  })(request());
  assert.equal(failedMail.status, 200);
  const failedUpload = await createHandler({
    ...deps,
    attach: async () => {
      throw new Error("offline");
    },
  })(request({ screenshot: png }));
  assert.equal((await failedUpload.json()).attachmentSaved, false);
  assert.equal(
    (
      await createHandler({
        ...deps,
        save: async () => {
          throw new Error("rate_limit");
        },
      })(request())
    ).status,
    429,
  );
  assert.equal(
    (
      await createHandler({
        ...deps,
        save: async () => {
          throw new Error("offline");
        },
      })(request())
    ).status,
    503,
  );
  let canceled = false;
  const oversized = new Request("https://backend.test/feedback", {
    method: "POST",
    headers: {
      origin: "https://example.com",
      "Content-Type": "multipart/form-data; boundary=test",
    },
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(MAX_SCREENSHOT_BYTES + 40000));
      },
      cancel() {
        canceled = true;
      },
    }),
    duplex: "half",
  } as RequestInit & { duplex: string });
  assert.equal((await createHandler(deps)(oversized)).status, 413);
  assert.equal(canceled, true);
  console.log(
    "Feedback permissions, quotas, and request handler checks passed.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
