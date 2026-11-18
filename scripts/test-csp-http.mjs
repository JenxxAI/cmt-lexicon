// Run with node scripts/test-csp-http.mjs against a local production build.
import assert from "node:assert/strict";
const origin = "http://127.0.0.1:3218";
const seen = new Set();
for (const path of [
  "/",
  "/",
  "/community/create/",
  "/components/modal/",
  "/websites/portfolio/",
  "/preview/",
  "/missing-csp-test/",
]) {
  const response = await fetch(origin + path, {
    headers: { "x-nonce": "client-value" },
  });
  assert.equal(response.status, path === "/missing-csp-test/" ? 404 : 200);
  const policy = response.headers.get("content-security-policy") ?? "";
  const scriptPolicy = policy
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith("script-src "));
  const nonce = scriptPolicy?.match(/'nonce-([^']+)'/)?.[1];
  assert.ok(nonce && nonce !== "client-value" && !seen.has(nonce), path);
  seen.add(nonce);
  assert.doesNotMatch(scriptPolicy, /unsafe-inline|unsafe-eval/);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  const tags = [...(await response.text()).matchAll(/<script\b([^>]*)>/gi)];
  assert.ok(tags.length > 0);
  for (const [, attrs] of tags) {
    if (!/\bsrc=/.test(attrs))
      assert.ok(attrs.includes('nonce="' + nonce + '"'), path);
  }
  console.log(response.status, path, "matched fresh script nonce");
}
const frame = await fetch(origin + "/preview-frame/");
const policy = frame.headers.get("content-security-policy") ?? "";
assert.match(policy, /sandbox allow-scripts allow-forms;/);
assert.doesNotMatch(policy, /allow-same-origin|nonce-/);
assert.match(policy, /frame-ancestors 'self'/);
assert.match(policy, /connect-src 'none'/);
assert.equal(frame.headers.get("x-frame-options"), null);
console.log(frame.status, "/preview-frame/", "isolated sandbox policy");
