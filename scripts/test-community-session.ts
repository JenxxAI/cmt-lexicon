import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { communityApi } from "../src/lib/server/community-api";
import {
  sealCookie,
  openCookie,
  cookieHeader,
} from "../src/lib/server/session-cookie";

async function main() {
  const key = randomBytes(32);
  const sealed = sealCookie({ value: "test-credential" }, key, "session");
  assert.deepEqual(openCookie(sealed, key, "session"), {
    value: "test-credential",
  });
  assert.equal(openCookie(sealed, key, "oauth"), null);
  assert.equal(openCookie(sealed, randomBytes(32), "session"), null);
  const tampered = Buffer.from(sealed, "base64url");
  tampered[30] ^= 1;
  assert.equal(
    openCookie(tampered.toString("base64url"), key, "session"),
    null,
  );
  assert.equal(openCookie("invalid", key, "session"), null);
  assert.throws(() => cookieHeader("name", "x".repeat(3801), 60, true));
  const origin = "https://app.example.test";
  process.env.COMMUNITY_ORIGIN = origin;
  process.env.SUPABASE_URL = "https://supabase.example.test";
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_fixture";
  process.env.COMMUNITY_COOKIE_KEY = key.toString("base64");
  const now = Math.floor(Date.now() / 1000);
  const jwt = (exp: number) =>
    [
      Buffer.from('{"alg":"HS256"}').toString("base64url"),
      Buffer.from(JSON.stringify({ sub: "fixture-user", exp })).toString(
        "base64url",
      ),
      "fixture-signature",
    ].join(".");
  const access = jwt(now + 3600);
  const user = {
    id: "fixture-user",
    aud: "authenticated",
    email: "private@example.test",
    user_metadata: { user_name: "fixture", email: "private@example.test" },
    identities: [],
    app_metadata: {},
    created_at: "2026-01-01T00:00:00Z",
  };
  const session = {
    access_token: access,
    refresh_token: "fixture-refresh",
    token_type: "bearer",
    expires_in: 3600,
    user,
  };
  const originalFetch = globalThis.fetch;
  let active = true;
  let calls = 0;
  let verifier = "";
  let receivedAuthorization = "";
  let receivedUrl = "";
  globalThis.fetch = async (input, init) => {
    calls++;
    const url = String(input);
    const headers = new Headers(init?.headers);
    if (url.includes("/auth/v1/token")) {
      const body = JSON.parse(String(init?.body));
      if (body.auth_code) verifier = body.code_verifier;
      return Response.json(session);
    }
    if (url.includes("/auth/v1/user")) return Response.json(user);
    if (url.includes("/rest/v1/rpc/community_session_active"))
      return Response.json(active);
    if (url.includes("/auth/v1/logout")) {
      active = false;
      return new Response(null, { status: 204 });
    }
    if (url.includes("/rest/v1/")) {
      receivedUrl = url;
      receivedAuthorization = headers.get("authorization") ?? "";
      return Response.json([], { headers: { "content-range": "*/0" } });
    }
    throw new Error("Unexpected network request");
  };
  const request = (
    action: string,
    method = "GET",
    cookie = "",
    body?: unknown,
    from = origin,
  ) =>
    communityApi(
      new Request(`${origin}/api/community/${action}`, {
        method,
        headers: { origin: from, "content-type": "application/json", cookie },
        ...(method === "POST" ? { body: JSON.stringify(body ?? {}) } : {}),
      }),
    );
  const cookieFrom = (response: Response, name: string) =>
    response.headers
      .getSetCookie()
      .find((item) => item.startsWith(name + "="))
      ?.split(";")[0] ?? "";
  try {
    assert.equal(
      (await request("login/", "POST", "", {}, "https://evil.example.test"))
        .status,
      403,
    );
    assert.equal(calls, 0);
    assert.equal(
      (await request("rpc/", "POST", "", { name: "submit_community_project" }))
        .status,
      401,
    );
    assert.equal(calls, 0);
    const login = await request("login/", "POST");
    assert.equal(login.status, 200);
    const flowCookie = cookieFrom(login, "__Host-community-oauth");
    assert.ok(flowCookie);
    const loginBody = await login.json();
    const callback = new URL(
      new URL(loginBody.data.url).searchParams.get("redirect_to")!,
    );
    assert.equal(callback.origin, origin);
    assert.ok(new URL(loginBody.data.url).searchParams.get("code_challenge"));
    const failed = await request(
      "callback/?code=fixture&state=incorrect",
      "GET",
      flowCookie,
    );
    assert.match(failed.headers.get("location")!, /error=access_denied/);
    assert.equal(calls, 0);
    const result = await request(
      `callback/?code=fixture&state=${callback.searchParams.get("state")}`,
      "GET",
      flowCookie,
    );
    assert.equal(result.status, 303);
    assert.ok(verifier.length > 30);
    const authCookie = cookieFrom(result, "__Host-community-session");
    assert.ok(authCookie);
    const rawCookie = result.headers
      .getSetCookie()
      .find((item) => item.startsWith("__Host-community-session="))!;
    for (const flag of [
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      "Path=/",
      "Max-Age=604800",
    ])
      assert.ok(rawCookie.includes(flag), flag);
    assert.ok(!rawCookie.includes("Domain="));
    assert.ok(!rawCookie.includes(access));
    const display = await request("session/", "GET", authCookie);
    assert.equal(display.headers.get("cache-control"), "private, no-store");
    const body = await display.text();
    assert.ok(body.includes('"user_name":"fixture"'));
    for (const secret of [
      access,
      "fixture-refresh",
      "private@example.test",
      "access_token",
      "refresh_token",
    ])
      assert.ok(!body.includes(secret));
    const gallery = await request("projects/?view=mine", "GET", authCookie);
    assert.equal(gallery.status, 200);
    assert.equal(receivedAuthorization, `Bearer ${access}`);
    assert.equal(
      (
        await request("rpc/", "POST", authCookie, {
          name: "arbitrary_admin_function",
        })
      ).status,
      400,
    );
    const forged = await request(
      "session/",
      "GET",
      "__Host-community-session=forged",
    );
    assert.equal((await forged.json()).data.session, null);
    const expired = sealCookie(
      {
        access: jwt(now - 1),
        refresh: "fixture-refresh",
        expires: now - 1,
        deadline: now + 1000,
      },
      key,
      "session",
    );
    const refreshed = await request(
      "session/",
      "GET",
      `__Host-community-session=${expired}`,
    );
    assert.equal(refreshed.status, 200);
    assert.ok(cookieFrom(refreshed, "__Host-community-session"));
    assert.equal((await request("projects/?view=saved")).status, 401);
    assert.equal(
      (await request("bookmark/?id=00000000-0000-4000-8000-000000000001"))
        .status,
      401,
    );
    assert.equal((await request("projects/?source=invalid")).status, 400);
    assert.equal((await request("projects/?author=bad%25name")).status, 400);
    assert.equal(
      (await request("projects/?view=browse&source=github&author=maker"))
        .status,
      200,
    );
    let filters = new URL(receivedUrl).searchParams;
    assert.equal(filters.get("repository_url"), "not.is.null");
    assert.equal(filters.get("author"), "ilike.maker");
    assert.ok(
      filters.getAll("status").every((value) => value === "eq.approved"),
    );
    assert.equal(
      (await request("projects/?view=saved&source=code", "GET", authCookie))
        .status,
      200,
    );
    filters = new URL(receivedUrl).searchParams;
    assert.equal(filters.get("community_bookmarks.user_id"), "eq.fixture-user");
    assert.equal(filters.get("status"), "eq.approved");
    assert.equal(filters.get("repository_url"), "is.null");
    assert.match(filters.get("select")!, /community_bookmarks!inner/);
    const bookmark = await request(
      "bookmark/?id=00000000-0000-4000-8000-000000000001",
      "GET",
      authCookie,
    );
    assert.equal(bookmark.status, 200);
    assert.equal((await bookmark.json()).data, false);
    assert.equal(
      new URL(receivedUrl).searchParams.get("user_id"),
      "eq.fixture-user",
    );
    const logout = await request("logout/", "POST", authCookie);
    assert.equal(logout.status, 200);
    assert.match(logout.headers.get("set-cookie")!, /Max-Age=0/);
    const stale = await request("session/", "GET", authCookie);
    assert.equal(stale.status, 401);
    assert.match(stale.headers.get("set-cookie")!, /Max-Age=0/);
    assert.equal(
      (await request("projects/?view=mine", "GET", authCookie)).status,
      401,
    );
    const clientSource = readFileSync("src/lib/supabase.ts", "utf8");
    assert.ok(!clientSource.includes("@supabase/supabase-js"));
    assert.ok(!clientSource.includes("localStorage.setItem"));
    assert.ok(!clientSource.includes("sessionStorage.setItem"));
    console.log(
      "Community session tests passed: PKCE, CSRF, cookie encryption/flags, token isolation, refresh, user-scoped queries, logout.",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
