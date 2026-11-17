import { createClient, type Session, type User } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { BASE_PATH } from "../base-path";
import { SUMMARY_COLUMNS, isProjectId } from "../community";
import { communityFetch } from "../community-resilience";
import { displayName } from "../community-ui";
import {
  cookieHeader,
  openCookie,
  sameOriginMutation,
  sealCookie,
} from "./session-cookie";

type Credentials = {
  access: string;
  refresh: string;
  expires: number;
  deadline: number;
};
type Flow = {
  storage: Record<string, string>;
  state: string;
  deadline: number;
};
const WEEK = 7 * 86400;
function profile(user: User) {
  const avatar = user.identities?.find(
    (identity) => identity.provider === "github",
  )?.identity_data?.avatar_url;
  return {
    user: {
      id: user.id,
      user_metadata: {
        user_name: displayName(user),
        ...(typeof avatar === "string" &&
        /^https:\/\/avatars\.githubusercontent\.com\//.test(avatar)
          ? { avatar_url: avatar }
          : {}),
      },
    },
  };
}
async function readBody(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) return {};
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 350_000) {
      await reader.cancel();
      throw new Error("Body too large");
    }
    chunks.push(value);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8")) as Record<
    string,
    unknown
  >;
}
/** Same-origin BFF; uses the user's JWT and publishable key, never service-role access. */
export async function communityApi(request: Request): Promise<Response> {
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    Vary: "Cookie",
    "Referrer-Policy": "no-referrer",
  });
  const json = (data: unknown, status = 200) =>
    Response.json(data, { status, headers });
  const fail = (status: number, message = "Community request failed") =>
    json({ data: null, error: { status, message } }, status);
  try {
    const url = new URL(request.url);
    const origin = process.env.COMMUNITY_ORIGIN;
    const supabaseUrl = process.env.SUPABASE_URL;
    const publishable = process.env.SUPABASE_PUBLISHABLE_KEY;
    const encodedKey = process.env.COMMUNITY_COOKIE_KEY;
    if (!origin || !supabaseUrl || !publishable || !encodedKey)
      return fail(503, "Community is not configured");
    const key = Buffer.from(encodedKey, "base64");
    if (key.length !== 32 || new URL(origin).origin !== origin)
      return fail(503);
    const secure = new URL(origin).protocol === "https:";
    if (
      !secure &&
      (process.env.NODE_ENV === "production" ||
        !["localhost", "127.0.0.1"].includes(new URL(origin).hostname))
    )
      return fail(503);
    const sessionName = secure
      ? "__Host-community-session"
      : "community-session-dev";
    const flowName = secure ? "__Host-community-oauth" : "community-oauth-dev";
    const cookies = new Map(
      (request.headers.get("cookie") ?? "").split(";").map((part) => {
        const split = part.indexOf("=");
        return [part.slice(0, split).trim(), part.slice(split + 1)];
      }),
    );
    const now = Math.floor(Date.now() / 1000);
    const setCookie = (name: string, value: string, age: number) =>
      headers.append("Set-Cookie", cookieHeader(name, value, age, secure));
    const action = url.pathname
      .slice(`${BASE_PATH}/api/community/`.length)
      .replace(/\/$/, "");
    if (!["GET", "POST"].includes(request.method)) return fail(405);
    if (request.method === "POST" && !sameOriginMutation(request, origin))
      return fail(403);
    const client = (access?: string, storage?: Record<string, string>) =>
      createClient(supabaseUrl, publishable, {
        global: {
          fetch: communityFetch,
          ...(access ? { headers: { Authorization: `Bearer ${access}` } } : {}),
        },
        auth: {
          flowType: "pkce",
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: !!storage,
          ...(storage
            ? {
                storage: {
                  getItem: (name: string) => storage[name] ?? null,
                  setItem: (name: string, value: string) => {
                    storage[name] = value;
                  },
                  removeItem: (name: string) => {
                    delete storage[name];
                  },
                },
              }
            : {}),
        },
      });
    const redirect = (path: string) => {
      headers.set("Location", `${origin}${BASE_PATH}${path}`);
      return new Response(null, { status: 303, headers });
    };
    const save = (session: Session, deadline: number) => {
      const credentials: Credentials = {
        access: session.access_token,
        refresh: session.refresh_token,
        expires: session.expires_at!,
        deadline,
      };
      setCookie(
        sessionName,
        sealCookie(credentials, key, "session"),
        deadline - now,
      );
      return credentials;
    };
    if (action === "login" && request.method === "POST") {
      const storage: Record<string, string> = {};
      const state = randomBytes(24).toString("base64url");
      const { data, error } = await client(
        undefined,
        storage,
      ).auth.signInWithOAuth({
        provider: "github",
        options: {
          skipBrowserRedirect: true,
          redirectTo: `${origin}${BASE_PATH}/api/community/callback/?state=${state}`,
        },
      });
      if (error || !data.url) return fail(502);
      setCookie(
        flowName,
        sealCookie({ storage, state, deadline: now + 600 }, key, "oauth"),
        600,
      );
      return json({ data: { url: data.url }, error: null });
    }
    if (action === "callback" && request.method === "GET") {
      const flow = openCookie<Flow>(cookies.get(flowName), key, "oauth");
      setCookie(flowName, "", 0);
      const code = url.searchParams.get("code");
      if (
        !flow ||
        flow.deadline <= now ||
        flow.state !== url.searchParams.get("state") ||
        !code ||
        code.length > 2048
      )
        return redirect("/community/auth/?error=access_denied");
      const { data, error } = await client(
        undefined,
        flow.storage,
      ).auth.exchangeCodeForSession(code);
      if (error || !data.session)
        return redirect("/community/auth/?error=access_denied");
      save(data.session, now + WEEK);
      return redirect("/community/auth/");
    }
    let credentials = openCookie<Credentials>(
      cookies.get(sessionName),
      key,
      "session",
    );
    let user: User | null = null;
    if (credentials && credentials.deadline > now) {
      if (credentials.expires <= now + 60) {
        const { data, error } = await client().auth.refreshSession({
          refresh_token: credentials.refresh,
        });
        if (error || !data.session)
          return fail(401, "Session expired; sign in again");
        credentials = save(data.session, credentials.deadline);
      }
      const { data, error } = await client().auth.getUser(credentials.access);
      if (error) return fail(401, "Session expired; sign in again");
      user = data.user;
    } else credentials = null;
    const api = client(user ? credentials?.access : undefined);
    if (user && action !== "logout") {
      const { data: active, error } = await api.rpc("community_session_active");
      if (error) return fail(503, "Session verification unavailable");
      if (active !== true) {
        setCookie(sessionName, "", 0);
        return fail(401, "Session expired; sign in again");
      }
    }
    if (action === "session" && request.method === "GET")
      return json({
        data: { session: user ? profile(user) : null },
        error: null,
      });
    if (action === "logout" && request.method === "POST") {
      if (credentials && user) {
        const { error } = await client().auth.admin.signOut(
          credentials.access,
          "global",
        );
        if (error) return fail(502, "Sign out could not be completed");
      }
      setCookie(sessionName, "", 0);
      return json({ data: null, error: null });
    }
    if (action === "projects" && request.method === "GET") {
      const view = url.searchParams.get("view") ?? "browse";
      if (!["browse", "mine", "moderate"].includes(view)) return fail(400);
      if (view !== "browse" && !user) return fail(401);
      if (view === "moderate") {
        const { data, error } = await api.rpc("is_community_moderator");
        if (error || data !== true) return fail(403);
      }
      const page = Number(url.searchParams.get("page") ?? 0);
      if (!Number.isInteger(page) || page < 0 || page > 10000) return fail(400);
      let query = api
        .from("community_projects")
        .select(SUMMARY_COLUMNS, { count: "exact" })
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(page * 12, page * 12 + 11);
      if (view === "mine") query = query.eq("owner_id", user!.id);
      else
        query = query.eq("status", view === "browse" ? "approved" : "pending");
      const kind = url.searchParams.get("kind");
      if (kind && kind !== "all") {
        if (!["component", "website"].includes(kind)) return fail(400);
        query = query.eq("kind", kind);
      }
      const search = (url.searchParams.get("search") ?? "")
        .trim()
        .slice(0, 100);
      if (search)
        query = query.ilike(
          "title",
          `%${search.replace(/[\\%_]/g, (value) => "\\" + value)}%`,
        );
      const { data, error, count } = await query;
      return error ? fail(502) : json({ data, count, error: null });
    }
    if (action === "project" && request.method === "GET") {
      const id = url.searchParams.get("id") ?? "";
      if (!isProjectId(id)) return fail(400);
      const { data, error } = await api
        .from("community_projects")
        .select("*")
        .eq("id", id)
        .single();
      return error
        ? fail(404, "Project unavailable")
        : json({ data, error: null });
    }
    if (action === "rpc" && request.method === "POST") {
      if (!user) return fail(401);
      const body = await readBody(request);
      const allowed = [
        "is_community_moderator",
        "submit_community_project",
        "review_community_project",
        "withdraw_community_project",
      ];
      if (
        typeof body.name !== "string" ||
        !allowed.includes(body.name) ||
        (body.args != null &&
          (typeof body.args !== "object" || Array.isArray(body.args)))
      )
        return fail(400);
      const { data, error } = await api.rpc(
        body.name,
        body.args as Record<string, unknown> | undefined,
      );
      return error
        ? json(
            {
              data: null,
              error: {
                code: error.code,
                message: "Community action could not be completed",
              },
            },
            400,
          )
        : json({ data, error: null });
    }
    return fail(404);
  } catch {
    // Never return/log raw upstream errors, OAuth codes, tokens or profile data.
    return fail(400);
  }
}
