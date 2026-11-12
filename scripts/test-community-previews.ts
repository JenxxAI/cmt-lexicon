import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { SUMMARY_COLUMNS } from "../src/lib/community";
import {
  PREVIEW_LIMITS,
  fitWithin,
  isPreviewMime,
  isPreviewPath,
  previewAlt,
  previewFileError,
  previewPath,
} from "../src/lib/community-previews";
import { importKind, splitHtmlDocument } from "../src/lib/import-files";

const U1 = "00000000-0000-4000-8000-000000000001";
const U2 = "00000000-0000-4000-8000-000000000002";
const U3 = "00000000-0000-4000-8000-000000000003";
const I = (n: number) => `10000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

// ---- pure helpers
assert.deepEqual(fitWithin(4000, 2000, 1280), { width: 1280, height: 640 });
assert.deepEqual(fitWithin(800, 600, 1280), { width: 800, height: 600 }, "never upscale");
assert.deepEqual(fitWithin(5000, 1, 1280), { width: 1280, height: 1 }, "keeps at least 1px");
assert.equal(previewPath(U1.toUpperCase(), I(1), "image/webp"), `${U1}/${I(1)}.webp`);
assert.equal(previewPath(U1, I(1), "image/jpeg"), `${U1}/${I(1)}.jpg`);
assert.throws(() => previewPath(U1, I(1), "image/svg+xml"), /WebP, PNG or JPEG/);
assert.throws(() => previewPath("../etc", I(1), "image/png"), /Invalid/);
assert(isPreviewPath(`${U1}/${I(2)}.png`));
for (const bad of [`${U1}/../${I(2)}.png`, `${U1}/${I(2)}.svg`, `${U1}/${I(2)}.png/x`, "x/y.png", 5, null])
  assert(!isPreviewPath(bad), String(bad));
assert(isPreviewMime("image/png") && !isPreviewMime("image/svg+xml") && !isPreviewMime("image/gif"));
assert.match(previewFileError({ type: "image/svg+xml", size: 10 })!, /PNG, JPEG or WebP/);
assert.match(previewFileError({ type: "image/png", size: 13_000_000 })!, /12 MB/);
assert.equal(previewFileError({ type: "image/webp", size: 1000 }), null);
assert.equal(previewAlt("Pricing page", 0, 1), "Pricing page preview");
assert.equal(previewAlt("  ", 1, 3), "Project preview, image 2 of 3");
assert(PREVIEW_LIMITS.maxBytes <= 614_400, "client limit stays under the bucket limit");
assert(SUMMARY_COLUMNS.split(",").includes("previews"), "gallery needs previews");

// ---- importing
assert.equal(importKind({ name: "Index.HTML", type: "" }), "html");
assert.equal(importKind({ name: "a.mjs", type: "" }), "js");
assert.equal(importKind({ name: "shot", type: "image/png" }), "image");
assert.equal(importKind({ name: "logo.svg", type: "image/svg+xml" }), null);
assert.equal(importKind({ name: "run.exe", type: "" }), null);
const page = splitHtmlDocument(`<!doctype html><html><head><meta charset="utf-8"><title>T</title>
<link rel="stylesheet" href="x.css"><style>body{margin:0}</style></head>
<body class="x"><!-- note --><h1>Hi</h1><img src="https://cdn.example/a.png" alt="">
<script src="https://cdn.example/lib.js"></script>
<script type="application/json" id="data">{"a":1}</script>
<script>document.title="x"</script></body></html>`);
assert.equal(page.source.css, "body{margin:0}");
assert.equal(page.source.js, 'document.title="x"');
assert(page.source.html.startsWith("<h1>Hi</h1>"));
assert(page.source.html.includes('id="data"'), "non-JS script data stays in the HTML");
assert(!/<style|<head|<title|doctype|<link|lib\.js|note/i.test(page.source.html));
assert.equal(page.warnings.length, 3);
const fragment = splitHtmlDocument("<main><p>Just a fragment</p></main><style>p{color:red}</style>");
assert.deepEqual(fragment.source, { html: "<main><p>Just a fragment</p></main>", css: "p{color:red}", js: "" });
assert.deepEqual(splitHtmlDocument("").source, { html: "", css: "", js: "" });

// ---- site CSP lets the page show signed Supabase images and local blob thumbnails
const csp = JSON.parse(readFileSync("vercel.json", "utf8")).headers[0].headers.find(
  (h: { key: string }) => h.key === "Content-Security-Policy",
).value as string;
const imgSrc = csp.split(";").map((d) => d.trim()).find((d) => d.startsWith("img-src "))!;
assert(imgSrc.includes("https://*.supabase.co") && imgSrc.includes("blob:"), imgSrc);
assert(!/img-src[^;]*\*(?!\.supabase)/.test(csp), "no open img-src wildcard");

// ---- database: migration, policies and RPC
async function main() {
  const db = new PGlite();
  await db.exec(`create role anon; create role authenticated; create schema auth;
    alter default privileges in schema public grant execute on functions to anon, authenticated;
    create table auth.users(id uuid primary key);
    create table auth.identities(user_id uuid, provider text, identity_data jsonb);
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;
    create schema storage;
    create table storage.buckets(id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:cardinality(string_to_array(name,'/'))-1] $$;
    grant usage on schema storage to anon, authenticated;
    grant select, insert, delete on storage.objects to anon, authenticated;
    grant execute on function storage.foldername(text) to anon, authenticated;`);
  for (const file of [
    "202610270001_community.sql",
    "20261028024314_restrict_anonymous_community_writes.sql",
    "20261111000001_community_previews.sql",
  ])
    await db.exec(readFileSync(`supabase/migrations/${file}`, "utf8"));
  const bucket = (await db.query<{ public: boolean; file_size_limit: string; allowed_mime_types: string[] }>(
    "select public, file_size_limit, allowed_mime_types from storage.buckets where id='community-previews'",
  )).rows[0];
  assert.equal(bucket.public, false, "bucket must stay private");
  assert(!bucket.allowed_mime_types.includes("image/svg+xml"));
  for (const [id, name] of [[U1, "maker"], [U2, "reader"], [U3, "maintainer"]]) {
    await db.query("insert into auth.users values($1)", [id]);
    await db.query("insert into auth.identities values($1,'github',jsonb_build_object('user_name',$2::text))", [id, name]);
  }
  await db.query("insert into community_private.moderators values($1)", [U3]);
  async function as(id: string | null) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id ?? ""]);
    await db.exec(`set role ${id ? "authenticated" : "anon"}`);
  }
  const upload = (name: string) =>
    db.query("insert into storage.objects(bucket_id,name) values('community-previews',$1)", [name]);
  const visible = async (name: string) =>
    (await db.query("select 1 from storage.objects where name=$1", [name])).rows.length === 1;
  const submit = (previews: string[]) =>
    db.query<{ id: string }>(
      "select public.submit_community_project($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) as id",
      ["Landing page", "A responsive landing page with a hero section.", "website", ["landing"], "<h1>Hi</h1>", "", "", true, null, previews],
    );
  const a = `${U1}/${I(1)}.webp`, b = `${U1}/${I(2)}.png`;

  // uploads: own folder only
  await as(U1);
  await upload(a);
  await upload(b);
  await assert.rejects(upload(`${U2}/${I(3)}.webp`), /row-level security/);
  await assert.rejects(
    db.query("insert into storage.objects(bucket_id,name) values('other-bucket',$1)", [`${U1}/${I(3)}.webp`]),
    /row-level security/,
  );
  await as(null);
  await assert.rejects(upload(`${U1}/${I(4)}.webp`), /row-level security|permission denied/);

  // submit validation
  await as(null);
  await assert.rejects(submit([]), /permission denied/);
  await as(U1);
  await assert.rejects(submit([`${U1}/${I(9)}.webp`]), /finished uploading/, "missing object");
  await assert.rejects(submit([`${U2}/${I(3)}.webp`]), /four of your own/, "someone else's folder");
  await assert.rejects(submit([`${U1}/../${U2}/${I(3)}.webp`]), /four of your own/);
  await assert.rejects(submit([`${U1}/${I(1)}.svg`]), /four of your own/);
  await assert.rejects(submit([a, a]), /four of your own/, "duplicates");
  await assert.rejects(submit([a, b, `${U1}/${I(5)}.png`, `${U1}/${I(6)}.png`, `${U1}/${I(7)}.png`]), /four of your own/);
  await assert.rejects(
    db.query("select public.submit_community_project($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
      ["Landing page", "A responsive landing page with a hero section.", "website", ["x"], "", "", "", true, null, null]),
    /four of your own/,
    "null previews",
  );
  assert.equal((await db.query("select * from community_projects")).rows.length, 0, "failed submits store nothing");
  // old 9-argument callers still work (previews default to none)
  const legacy = (await db.query<{ id: string }>(
    "select public.submit_community_project($1,$2,$3,$4,$5,$6,$7,$8,$9) as id",
    ["Plain project", "A text-only project without any screenshots.", "component", ["x"], "<p>x</p>", "", "", true, null],
  )).rows[0].id;
  assert.deepEqual((await db.query<{ previews: string[] }>("select previews from community_projects where id=$1", [legacy])).rows[0].previews, []);

  const project = (await submit([a, b])).rows[0].id;
  assert.deepEqual((await db.query<{ previews: string[] }>("select previews from community_projects where id=$1", [project])).rows[0].previews, [a, b]);

  // pending: owner and moderator see the images, nobody else
  assert(await visible(a));
  await as(U3); assert(await visible(a), "moderator");
  await as(U2); assert(!(await visible(a)), "other user, pending");
  await as(null); assert(!(await visible(a)), "anon, pending");

  // approval publishes the images; rejection hides them again
  await as(U3);
  await db.query("select review_community_project($1,'approved','')", [project]);
  await as(U2); assert(await visible(a) && await visible(b), "other user, approved");
  await as(null); assert(await visible(a), "anon, approved");
  assert(!(await visible(`${U1}/${I(8)}.webp`)), "unreferenced objects stay private");
  await as(U3);
  await db.query("select review_community_project($1,'rejected','No')", [project]);
  await as(null); assert(!(await visible(a)), "anon after unpublish");
  await as(U1); assert(await visible(a), "owner keeps access");

  // delete: only unreferenced objects of your own
  await as(U1);
  const spare = `${U1}/${I(10)}.webp`;
  await upload(spare);
  assert.equal((await db.query("delete from storage.objects where name=$1 returning 1", [a])).rows.length, 0, "referenced");
  assert.equal((await db.query("delete from storage.objects where name=$1 returning 1", [spare])).rows.length, 1, "spare");
  await as(U2);
  await as(U3);
  await db.exec("reset role");
  await upload2(db, `${U2}/${I(11)}.webp`);
  await as(U1);
  assert.equal((await db.query("delete from storage.objects where name=$1 returning 1", [`${U2}/${I(11)}.webp`])).rows.length, 0, "someone else's");

  // upload cap: 40 objects per account (a and b already count)
  await as(U1);
  let accepted = 2;
  for (let n = 100; n < 160; n++) {
    try {
      await upload(`${U1}/${I(n)}.webp`);
      accepted++;
    } catch (error) {
      assert.match(String(error), /row-level security/);
      break;
    }
  }
  assert.equal(accepted, 40, "40 objects per account");
  await as(U2);
  await upload(`${U2}/${I(200)}.webp`); // another account is unaffected

  // anon can never execute the RPC; function is not callable through the old 9-arg signature after drop
  await as(null);
  await assert.rejects(
    db.query("select public.submit_community_project('Abc','A responsive landing page with a hero section.','website','{}','','','',true,null,'{}')"),
    /permission denied/,
  );
  console.log("community previews ok");
}
async function upload2(db: PGlite, name: string) {
  await db.query("insert into storage.objects(bucket_id,name) values('community-previews',$1)", [name]);
}
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
