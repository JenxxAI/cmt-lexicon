import assert from "node:assert/strict";
import {
  communityError,
  communityFetch,
  parseLocalDraft,
  writeLocalDraft,
  DRAFT_KEY,
  shouldRestoreDraft,
} from "../src/lib/community-resilience";
import { EMPTY_DRAFT } from "../src/lib/community";
async function main() {
  assert.match(communityError({}, true), /offline/);
  assert.match(communityError({ status: 429 }), /5 per hour/);
  assert.match(communityError({ code: "42501" }), /permission/);
  assert.match(communityError({ message: "JWT expired" }), /Sign in/);
  assert.match(
    communityError(new DOMException("timed out", "TimeoutError")),
    /My submissions/,
  );
  assert(
    !communityError({ message: "database secret: supersecret" }).includes(
      "supersecret",
    ),
  );
  const remix = "00000000-0000-4000-8000-000000000001";
  assert(shouldRestoreDraft({ ...EMPTY_DRAFT, remixOf: remix }, remix));
  assert(!shouldRestoreDraft(EMPTY_DRAFT, remix));
  assert(shouldRestoreDraft(EMPTY_DRAFT, null));
  let saved = "";
  writeLocalDraft(
    {
      setItem(key, value) {
        assert.equal(key, DRAFT_KEY);
        saved = value;
      },
    },
    { ...EMPTY_DRAFT, title: "Unsaved work", licenseAccepted: true },
  );
  assert.equal(parseLocalDraft(saved).title, "Unsaved work");
  assert.equal(parseLocalDraft(saved).licenseAccepted, false);
  assert.throws(() => parseLocalDraft("{}"));
  assert.throws(() => parseLocalDraft("x".repeat(2_000_001)));
  assert.throws(
    () =>
      writeLocalDraft(
        {
          setItem() {
            throw new Error("quota");
          },
        },
        EMPTY_DRAFT,
      ),
    /quota/,
  );
  assert.throws(() =>
    writeLocalDraft(
      {
        setItem() {
          assert.fail("must not save oversized code");
        },
      },
      { ...EMPTY_DRAFT, html: "x".repeat(100001) },
    ),
  );
  assert.equal(
    "token" in
      parseLocalDraft(JSON.stringify({ ...EMPTY_DRAFT, token: "secret" })),
    false,
  );
  const mock: typeof fetch = async (_url, init) =>
    new Promise((_resolve, reject) => {
      if (init?.signal?.aborted) reject(init.signal.reason);
      init?.signal?.addEventListener(
        "abort",
        () => reject(init.signal!.reason),
        { once: true },
      );
    });
  await assert.rejects(
    communityFetch("https://example.test", undefined, mock, 10),
    /timed out/,
  );
  await assert.rejects(
    communityFetch(
      "https://example.test",
      undefined,
      async (_url, init) =>
        new Response(
          new ReadableStream({
            start(controller) {
              init?.signal?.addEventListener(
                "abort",
                () => controller.error(init.signal!.reason),
                { once: true },
              );
            },
          }),
        ),
      10,
    ),
    /timed out/,
  );
  const abort = new AbortController();
  abort.abort(new Error("caller canceled"));
  await assert.rejects(
    communityFetch("https://example.test", { signal: abort.signal }, mock),
    /caller canceled/,
  );
  const response = await communityFetch(
    "https://example.test",
    undefined,
    async () =>
      new Response('{"ok":true}', {
        headers: { "Content-Type": "application/json" },
      }),
  );
  assert.deepEqual(await response.json(), { ok: true });
  console.log(
    "Resilience checks passed: safe errors, timeout/cancellation, draft recovery and storage failure.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
