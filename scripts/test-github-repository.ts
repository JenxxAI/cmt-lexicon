import assert from "node:assert/strict";
import {
  repositorySuggestions,
  publicWebsite,
} from "../src/lib/github-repository";
import {
  lookupRepository,
  RepositoryLookupError,
} from "../src/lib/server/github-repository";
import { GET as metadataRoute } from "../src/app/api/github-repository/route";
import { GET as previewRoute } from "../src/app/repository-preview/route";

async function main() {
  const fixture = {
    name: "my_project",
    private: false,
    description: "A useful project with a clear interface.",
    topics: ["React", "responsive-design", "React", "", "@"],
    language: "TypeScript",
    homepage: "https://demo.public-domain.com/landing?q=1&x=2",
  };
  const suggestions = repositorySuggestions(fixture);
  assert.deepEqual(suggestions.tags, [
    "react",
    "responsive-design",
    "typescript",
  ]);
  assert.equal(suggestions.title, "my project");
  assert.equal(suggestions.website, fixture.homepage);
  assert.throws(() => repositorySuggestions({ ...fixture, private: true }));
  assert.equal(
    repositorySuggestions({
      ...fixture,
      description: null,
      homepage: "",
      topics: null,
      language: null,
    }).description,
    "",
  );
  assert.equal(
    repositorySuggestions({
      ...fixture,
      topics: Array.from({ length: 10 }, (_, i) => `tag-${i}`),
    }).tags.length,
    5,
  );
  for (const url of [
    "javascript:alert(1)",
    "http://demo.public-domain.com",
    "https://localhost",
    "https://127.0.0.1/",
    "https://[::1]/",
    "https://2130706433",
    "https://user:password@public-domain.com",
    "https://public-domain.com:444",
    "https://box.internal",
    "https://my.lan",
    "https://foo.localhost",
    "https://public-domain.com\n;script-src *",
  ])
    assert.equal(publicWebsite(url), null, url);
  let calls = 0;
  const mock = (async (input, init) => {
    calls++;
    assert.equal(String(input), "https://api.github.com/repos/maker/project");
    assert.equal(init?.redirect, "error");
    assert(!new Headers(init?.headers).has("authorization"));
    return Response.json(fixture);
  }) as typeof fetch;
  assert.deepEqual(
    await lookupRepository("https://github.com/maker/project", mock),
    suggestions,
  );
  await assert.rejects(
    lookupRepository("https://evil.test/maker/project", mock),
    RepositoryLookupError,
  );
  assert.equal(calls, 1, "invalid repository must never trigger a fetch");
  for (const [status, expected] of [
    [404, 404],
    [403, 429],
    [429, 429],
    [500, 502],
  ]) {
    await assert.rejects(
      lookupRepository(
        "https://github.com/maker/project",
        (async () => new Response("", { status })) as typeof fetch,
      ),
      (e: unknown) =>
        e instanceof RepositoryLookupError && e.status === expected,
    );
  }
  const original = globalThis.fetch;
  try {
    globalThis.fetch = mock;
    const request = new Request(
      "https://lexicon.test/api/github-repository/?repository=https%3A%2F%2Fgithub.com%2Fmaker%2Fproject",
    );
    const metadata = await metadataRoute(request);
    assert.equal(metadata.status, 200);
    assert.deepEqual((await metadata.json()).data, suggestions);
    const frame = await previewRoute(request);
    const policy = frame.headers.get("content-security-policy")!;
    assert.match(policy, /sandbox allow-scripts;/);
    assert.match(policy, /frame-src https:\/\/demo.public-domain.com;/);
    assert.doesNotMatch(
      policy,
      /allow-same-origin|allow-top-navigation|allow-forms/,
    );
    const html = await frame.text();
    assert.match(html, /q=1&amp;x=2/);
    assert.match(html, /referrerpolicy="no-referrer"/);
    globalThis.fetch = async () =>
      Response.json({
        ...fixture,
        homepage: 'https://public-domain.com/"<script>bad</script>',
      });
    const escaped = await (await previewRoute(request)).text();
    assert.doesNotMatch(escaped, /<script>/);
    globalThis.fetch = async () => {
      throw new Error("upstream private debug value");
    };
    const failed = await metadataRoute(request);
    assert.equal(failed.status, 502);
    assert.doesNotMatch(await failed.text(), /private debug/);
    const unavailable = await previewRoute(request);
    assert.match(
      unavailable.headers.get("content-security-policy")!,
      /frame-src 'none'/,
    );
  } finally {
    globalThis.fetch = original;
  }
  console.log(
    "GitHub repository tests passed: suggestions, public URL validation, fixed upstream, errors, API and sandbox policies.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
