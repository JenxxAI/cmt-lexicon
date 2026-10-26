import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { formatSample, formatSampleCode } from "../src/lib/format-sample";
import { assembleSample, splitSample } from "../src/lib/sample-source";
import { getWebsiteSample } from "../src/lib/website-samples";

async function main() {
  const css =
    '.sample::after{content:"a;b}";color:red}@media(max-width:600px){.sample{padding:2px}}';
  const formatted = await formatSampleCode(css, "css");
  assert(
    formatted.includes('"a;b}"'),
    "CSS strings must not be changed by formatting",
  );
  assert.equal(
    await formatSampleCode(formatted, "css"),
    formatted,
    "Formatting is idempotent",
  );
  await assert.rejects(formatSampleCode("const = ;", "js"));
  await assert.rejects(
    formatSampleCode("a".repeat(100_001), "html"),
    /too large/,
  );
  const invalid = {
    html: "<p>Hello</p>",
    css: "p { color: red }",
    js: "const = ;",
  };
  const before = { ...invalid };
  await assert.rejects(formatSample(invalid), /script.js/);
  assert.deepEqual(invalid, before, "An error must not mutate any file");
  let count = 0;
  for (const file of readdirSync("content/website-types")) {
    const id = JSON.parse(
      readFileSync(`content/website-types/${file}`, "utf8"),
    ).id;
    const original = getWebsiteSample(id);
    const source = await formatSample(splitSample(original));
    assert.deepEqual(
      await formatSample(source),
      source,
      `${id}: formatting must be stable`,
    );
    const output = assembleSample(original, source);
    assert(
      output.includes('<meta name="viewport"'),
      `${id}: viewport metadata retained`,
    );
    assert.deepEqual(
      splitSample(output),
      Object.fromEntries(
        Object.entries(source).map(([key, value]) => [key, value.trim()]),
      ),
    );
    count++;
  }
  console.log(
    `Editor checks passed: ${count} samples format, round-trip, and remain stable; invalid code and CSS string preservation checked.`,
  );
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
