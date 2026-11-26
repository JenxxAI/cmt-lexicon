import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  EMPTY_DRAFT,
  byteLength,
  communityDocument,
  draftError,
  githubRepositoryUrl,
  sourceError,
} from "../src/lib/community";

async function main() {
  assert.equal(byteLength("界"), 3);
  assert.equal(
    githubRepositoryUrl(" HTTPS://GITHUB.COM/Maker/my.repo/ "),
    "https://github.com/Maker/my.repo",
  );
  const invalidRepositories = [
    "javascript:alert(1)",
    "http://github.com/maker/repo",
    "https://github.com.evil.test/maker/repo",
    "https://github.com@evil.test/maker/repo",
    "https://user:pass@github.com/maker/repo",
    "https://github.com/maker/repo?token=secret",
    "https://github.com/maker/repo#readme",
    "https://github.com/maker/repo/tree/main",
    "https://github.com/maker/..",
    "https://github.com/maker/.",
    "https://github.com/maker/%2e%2e",
    "https://github.com/maker/repo\\evil",
  ];
  for (const url of invalidRepositories)
    assert.equal(githubRepositoryUrl(url), null, url);
  const showcaseDraft = {
    ...EMPTY_DRAFT,
    title: "My project",
    description: "A helpful project with a useful interface.",
    submissionType: "github" as const,
    repositoryUrl: "https://github.com/maker/project",
    licenseAccepted: true,
  };
  assert.equal(draftError(showcaseDraft), null);
  assert.match(
    draftError({ ...showcaseDraft, repositoryUrl: "javascript:alert(1)" })!,
    /repository URL/,
  );
  assert.match(
    draftError({ ...showcaseDraft, licenseAccepted: false })!,
    /permission/,
  );
  assert.match(
    sourceError({ html: "界".repeat(33334), css: "", js: "" })!,
    /100 KB/,
  );
  assert.equal(
    sourceError({
      html: "x".repeat(100000),
      css: "x".repeat(100000),
      js: "x".repeat(100000),
    }),
    null,
  );
  assert.match(
    draftError({
      ...EMPTY_DRAFT,
      title: "Good title",
      description: "A useful description of this project.",
      licenseAccepted: false,
    })!,
    /license/,
  );
  const doc = communityDocument(
    { html: "<h1>Example</h1>", css: "", js: 'const value="</script>";' },
    "<unsafe title>",
  );
  assert(doc.includes("connect-src 'none'"));
  assert(doc.includes("&lt;unsafe title>"));
  assert(doc.includes("<\\/script>"));
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    alter default privileges in schema public grant execute on functions to anon, authenticated;
    create schema storage;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:cardinality(string_to_array(name,'/'))-1] $$;
    grant usage on schema storage to anon, authenticated;
    grant select, insert, delete on storage.objects to anon, authenticated;
    grant execute on function storage.foldername(text) to anon, authenticated;
    create table auth.users(id uuid primary key);
    create table auth.sessions(id uuid primary key, user_id uuid, not_after timestamptz);
    create function auth.jwt() returns jsonb language sql stable as $$ select jsonb_build_object('session_id', current_setting('fixture.session_id',true)) $$;
    create table auth.identities(user_id uuid, provider text, identity_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
  await db.exec(
    readFileSync("supabase/migrations/20261028014154_community.sql", "utf8"),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261028024314_restrict_anonymous_community_writes.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261111000001_community_previews.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261117045756_require_active_community_session.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261126062208_community_github_showcases.sql",
      "utf8",
    ),
  );
  const owner = "00000000-0000-4000-8000-000000000001",
    other = "00000000-0000-4000-8000-000000000002",
    moderator = "00000000-0000-4000-8000-000000000003";
  for (const [id, name] of [
    [owner, "maker"],
    [other, "reader"],
    [moderator, "maintainer"],
  ]) {
    await db.query("insert into auth.users values($1)", [id]);
    await db.query(
      "insert into auth.identities values($1,'github',jsonb_build_object('user_name',$2::text))",
      [id, name],
    );
  }
  await db.query("insert into community_private.moderators values($1)", [
    moderator,
  ]);
  const withoutIdentity = "00000000-0000-4000-8000-000000000099";
  const sessions = new Map<string, string>();
  for (const id of [owner, other, moderator, withoutIdentity]) {
    const result = await db.query<{ id: string }>(
      "insert into auth.sessions values(gen_random_uuid(),$1,null) returning id",
      [id],
    );
    sessions.set(id, result.rows[0].id);
  }
  async function as(
    id: string | null,
    sessionId = sessions.get(id ?? "") ?? "",
  ) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      id ?? "",
    ]);
    await db.query("select set_config('fixture.session_id',$1,false)", [
      sessionId,
    ]);
    await db.exec(`set role ${id ? "authenticated" : "anon"}`);
  }
  async function submit(
    extra: { html?: string; accepted?: boolean; remix?: string } = {},
  ) {
    return db.query<{ id: string }>(
      `select public.submit_community_project($1,$2,$3,$4,$5,$6,$7,$8,$9) as id`,
      [
        "Test project",
        "A helpful community example for testing.",
        "component",
        ["test"],
        extra.html ?? "<h1>Hello</h1>",
        "",
        "",
        extra.accepted ?? true,
        extra.remix ?? null,
      ],
    );
  }
  await as(null);
  await assert.rejects(submit(), /permission denied/);
  await as("00000000-0000-4000-8000-000000000099");
  await assert.rejects(submit(), /verified GitHub identity/);
  await as(owner);
  await assert.rejects(submit({ accepted: false }), /license/);
  await assert.rejects(
    submit({ html: "界".repeat(33334) }),
    /check constraint/,
  );
  const project = (await submit()).rows[0].id;
  assert.equal(
    (
      await db.query<{ status: string }>(
        "select status from community_projects",
      )
    ).rows[0].status,
    "pending",
  );
  await assert.rejects(
    db.query("update community_projects set status='approved' where id=$1", [
      project,
    ]),
    /permission denied/,
  );
  await assert.rejects(
    db.query("delete from community_projects where id=$1", [project]),
    /permission denied/,
  );
  await assert.rejects(
    db.query("insert into community_projects (title) values ('Bypass')"),
    /permission denied/,
  );
  await assert.rejects(
    db.query("select * from community_private.moderators"),
    /permission denied/,
  );
  await as(other);
  assert.equal(
    (await db.query("select * from community_projects")).rows.length,
    0,
  );
  await assert.rejects(
    db.query("select review_community_project($1,'approved','')", [project]),
    /Moderator/,
  );
  await assert.rejects(
    db.query("select withdraw_community_project($1)", [project]),
    /cannot be withdrawn/,
  );
  await assert.rejects(submit({ remix: project }), /unavailable/);
  await as(null);
  assert.equal(
    (await db.query("select * from community_projects")).rows.length,
    0,
  );
  await as(moderator);
  assert.equal(
    (await db.query("select * from community_projects")).rows.length,
    1,
  );
  await db.query("select review_community_project($1,'approved','')", [
    project,
  ]);
  await as(null);
  assert.equal(
    (await db.query("select * from community_projects")).rows.length,
    1,
  );
  await as(other);
  const remix = (await submit({ remix: project })).rows[0].id;
  assert.equal(
    (
      await db.query<{ remix_of: string }>(
        "select remix_of from community_projects where id=$1",
        [remix],
      )
    ).rows[0].remix_of,
    project,
  );
  await as(moderator);
  await db.query(
    "select review_community_project($1,'rejected','Please improve keyboard access.')",
    [remix],
  );
  await as(other);
  assert.equal(
    (
      await db.query<{ review_note: string }>(
        "select review_note from community_projects where id=$1",
        [remix],
      )
    ).rows[0].review_note,
    "Please improve keyboard access.",
  );
  await as(owner);
  await db.query("select withdraw_community_project($1)", [project]);
  for (let i = 0; i < 4; i++) await submit();
  await assert.rejects(submit(), /Submission limit/);
  await as(null);
  assert.equal(
    (await db.query("select * from community_projects")).rows.length,
    0,
  );
  await db.exec("reset role");
  await db.query(
    "insert into community_private.submission_events(user_id,created_at) select $1,now()-interval '2 hours' from generate_series(1,20)",
    [other],
  );
  await as(other);
  await assert.rejects(submit(), /Submission limit/);
  // The owner has withdrawn their project and the second account owns a rejected remix.
  // Positive controls ensure an empty result signifies isolation, not a missing fixture.
  for (const [id, expected] of [
    [owner, [project]],
    [other, [remix]],
    [null, []],
  ] as const) {
    await as(id);
    const visible = await db.query<{ id: string }>(
      "select id from community_projects where id in ($1,$2)",
      [project, remix],
    );
    assert.deepEqual(
      visible.rows.map((row) => row.id),
      expected,
    );
  }
  await as(other);
  const image = other + "/10000000-0000-4000-8000-000000000001.webp";
  const putImage = (name: string) =>
    db.query(
      "insert into storage.objects(bucket_id,name) values ('community-previews',$1)",
      [name],
    );
  const readImage = () =>
    db.query("select id from storage.objects where name=$1", [image]);
  await putImage(image);
  assert.equal((await readImage()).rows.length, 1);
  // Keep the original signed claims while changing only the backing session.
  await db.exec("reset role");
  await db.query("delete from auth.sessions where user_id=$1", [other]);
  await as(other);
  assert.equal((await readImage()).rows.length, 0);
  await assert.rejects(
    putImage(image.replace(".webp", ".png")),
    /row-level security/,
  );
  assert.equal(
    (
      await db.query("delete from storage.objects where name=$1 returning id", [
        image,
      ])
    ).rows.length,
    0,
  );
  assert.equal(
    (await db.query("select id from community_projects")).rows.length,
    0,
  );
  await assert.rejects(submit(), /session expired/);
  await assert.rejects(
    db.query("select withdraw_community_project($1)", [remix]),
    /session expired/,
  );
  for (const invalid of ["", sessions.get(owner)!]) {
    await as(other, invalid);
    assert.equal(
      (
        await db.query<{ active: boolean }>(
          "select community_session_active() as active",
        )
      ).rows[0].active,
      false,
    );
  }
  await db.exec("reset role");
  await db.query("update auth.sessions set not_after=now() where user_id=$1", [
    moderator,
  ]);
  await as(moderator);
  assert.equal(
    (
      await db.query<{ allowed: boolean }>(
        "select is_community_moderator() as allowed",
      )
    ).rows[0].allowed,
    false,
  );
  await assert.rejects(
    db.query("select review_community_project($1,'approved','')", [remix]),
    /Moderator/,
  );
  await as(owner);
  assert.ok(
    (await db.query("select id from community_projects")).rows.length > 0,
  );
  // Link-only showcases share the same quotas, RLS, and storage privacy as code projects.
  // Reset only this in-memory test database's fixtures for independent quota assertions.
  await db.exec(
    "reset role; delete from community_private.submission_events; update auth.sessions set not_after=null;",
  );
  const cover = owner + "/20000000-0000-4000-8000-000000000001.webp";
  await as(owner);
  await putImage(cover);
  const showcase = (
    url = "https://github.com/maker/project",
    accepted = true,
    previews = [cover],
  ) =>
    db.query<{ id: string }>(
      "select submit_community_showcase($1,$2,$3,$4,$5,$6,$7) as id",
      [
        "Showcase project",
        "A useful project with a clear interface.",
        "website",
        ["showcase"],
        url,
        accepted,
        previews,
      ],
    );
  await assert.rejects(showcase(undefined, false), /permission/);
  await assert.rejects(showcase(undefined, true, []), /screenshot/);
  for (const url of invalidRepositories)
    await assert.rejects(showcase(url), /repository URL/);
  await assert.rejects(
    showcase(undefined, true, [image]),
    /own preview images/,
  );
  await assert.rejects(
    showcase(undefined, true, [cover.replace(".webp", ".png")]),
    /uploading/,
  );
  const showcaseId = (await showcase()).rows[0].id;
  const stored = (
    await db.query<{
      repository_url: string;
      license: string;
      html: string;
      css: string;
      js: string;
      status: string;
    }>(
      "select repository_url,license,html,css,js,status from community_projects where id=$1",
      [showcaseId],
    )
  ).rows[0];
  assert.deepEqual(stored, {
    repository_url: "https://github.com/maker/project",
    license: "Repository",
    html: "",
    css: "",
    js: "",
    status: "pending",
  });
  await assert.rejects(submit({ remix: showcaseId }), /unavailable/);
  await as(null);
  await assert.rejects(showcase(), /permission denied/);
  assert.equal(
    (
      await db.query("select id from community_projects where id=$1", [
        showcaseId,
      ])
    ).rows.length,
    0,
  );
  assert.equal(
    (await db.query("select id from storage.objects where name=$1", [cover]))
      .rows.length,
    0,
  );
  await as(other);
  assert.equal(
    (
      await db.query("select id from community_projects where id=$1", [
        showcaseId,
      ])
    ).rows.length,
    0,
  );
  await assert.rejects(showcase(), /session expired/);
  await as(moderator);
  assert.equal(
    (
      await db.query("select id from community_projects where id=$1", [
        showcaseId,
      ])
    ).rows.length,
    1,
  );
  await db.query("select review_community_project($1,'approved','')", [
    showcaseId,
  ]);
  await as(null);
  assert.equal(
    (
      await db.query("select id from community_projects where id=$1", [
        showcaseId,
      ])
    ).rows.length,
    1,
  );
  assert.equal(
    (await db.query("select id from storage.objects where name=$1", [cover]))
      .rows.length,
    1,
  );
  await as(owner);
  await assert.rejects(submit({ remix: showcaseId }), /unavailable/);
  for (let i = 0; i < 4; i++) await submit();
  await assert.rejects(showcase(), /Submission limit/);
  await db.query("select withdraw_community_project($1)", [showcaseId]);
  await as(null);
  assert.equal(
    (
      await db.query("select id from community_projects where id=$1", [
        showcaseId,
      ])
    ).rows.length,
    0,
  );
  assert.equal(
    (await db.query("select id from storage.objects where name=$1", [cover]))
      .rows.length,
    0,
  );
  await db.exec("reset role");
  // Even privileged direct writes cannot mislabel repository code as MIT.
  await assert.rejects(
    db.query("update community_projects set license='MIT' where id=$1", [
      showcaseId,
    ]),
    /check constraint/,
  );
  await assert.rejects(
    db.query(
      "update community_projects set html='<h1>Injected</h1>' where id=$1",
      [showcaseId],
    ),
    /check constraint/,
  );
  await db.close();
  console.log(
    "Community checks passed: UTF-8 limits, preview CSP, anonymous denial, private pending rows, moderator-only approval, direct-write denial, rejected feedback, remix attribution, withdrawal, hourly/daily quotas, GitHub showcase URLs, consent, screenshots, license separation and shared access controls.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
