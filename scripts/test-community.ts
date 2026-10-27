import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import {
  EMPTY_DRAFT,
  byteLength,
  communityDocument,
  draftError,
  sourceError,
} from "../src/lib/community";

async function main() {
  assert.equal(byteLength("界"), 3);
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
    create table auth.users(id uuid primary key);
    create table auth.identities(user_id uuid, provider text, identity_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;`);
  await db.exec(
    readFileSync("supabase/migrations/202610270001_community.sql", "utf8"),
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
  async function as(id: string | null) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [
      id ?? "",
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
  await db.close();
  console.log(
    "Community checks passed: UTF-8 limits, preview CSP, anonymous denial, private pending rows, moderator-only approval, direct-write denial, rejected feedback, remix attribution, withdrawal, hourly/daily quotas.",
  );
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
