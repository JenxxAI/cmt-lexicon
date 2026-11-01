import assert from "node:assert/strict";
import {
  parsePreview,
  PREVIEW_PREFIX,
  PREVIEW_TTL,
  storePreview,
} from "../src/lib/full-preview";
const snapshot = {
  title: "Current edits",
  document: "<h1>Edited</h1>",
  returnTo: "/websites/social-network/#sample-heading",
  createdAt: Date.now(),
};
assert.deepEqual(parsePreview(JSON.stringify(snapshot)), snapshot);
assert.equal(
  parsePreview(JSON.stringify(snapshot), snapshot.createdAt + PREVIEW_TTL),
  null,
);
for (const returnTo of [
  "//evil.example/",
  "https://evil.example/",
  "/community/\\evil",
  "/other/",
])
  assert.equal(parsePreview(JSON.stringify({ ...snapshot, returnTo })), null);
assert.equal(parsePreview("bad JSON"), null);
assert.equal(
  parsePreview(
    JSON.stringify({ ...snapshot, document: "x".repeat(2_000_000) }),
  ),
  null,
);
const data = new Map<string, string>();
const storage = {
  get length() {
    return data.size;
  },
  key: (index: number) => [...data.keys()][index] ?? null,
  getItem: (key: string) => data.get(key) ?? null,
  setItem: (key: string, value: string) => {
    data.set(key, value);
  },
  removeItem: (key: string) => {
    data.delete(key);
  },
  clear: () => data.clear(),
} satisfies Storage;
data.set("other-draft", "keep");
data.set(
  PREVIEW_PREFIX + "expired",
  JSON.stringify({ ...snapshot, createdAt: 0 }),
);
for (let i = 0; i < 8; i++)
  assert.equal(storePreview(storage, snapshot, String(i)), `/preview/?id=${i}`);
assert.equal(data.get("other-draft"), "keep");
assert.equal(data.has(PREVIEW_PREFIX + "expired"), false);
assert.equal(data.size, 6);
assert.equal(
  parsePreview(data.get(PREVIEW_PREFIX + "7")!)?.document,
  "<h1>Edited</h1>",
);
console.log(
  "Full preview checks passed: snapshots, expiration, safe return paths, invalid/oversize storage, bounded cleanup, unrelated drafts preserved.",
);
