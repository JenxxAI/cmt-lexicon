"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getCommunityClient } from "@/lib/supabase";
import {
  COMMUNITY_LIMITS,
  EMPTY_DRAFT,
  SUMMARY_COLUMNS,
  byteLength,
  communityDocument,
  downloadCommunity,
  draftError,
  isProjectId,
  sourceError,
  type CommunityDraft,
  type CommunityProject,
  type CommunitySummary,
} from "@/lib/community";
import type { SampleLanguage, SampleSource } from "@/lib/sample-source";
import { SampleCodeEditor } from "./SampleCodeEditor";
import { CopyButton } from "./CopyButton";

type View = "browse" | "create" | "project" | "mine" | "moderate" | "auth";
const button =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-ink px-5 py-3 text-sm font-semibold text-surface disabled:opacity-50";
const secondary =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-line px-4 py-2 text-sm font-semibold text-ink disabled:opacity-50";
const field =
  "mt-2 min-h-11 w-full rounded-xl border border-rule bg-surface px-4 py-3 text-ink";
const DRAFT_KEY = "ui-lexicon-community-draft-v1";
function message(error: unknown) {
  return typeof error === "object" && error && "message" in error
    ? String(error.message).slice(0, 700)
    : "Something went wrong. Please try again.";
}

export function CommunityApp({ view }: { view: View }) {
  const [client, setClient] = useState<SupabaseClient | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [moderator, setModerator] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const api = getCommunityClient();
    setClient(api);
    if (!api) {
      setReady(true);
      return;
    }
    const { data: listener } = api.auth.onAuthStateChange((_event, value) => {
      if (alive) setSession(value);
    });
    api.auth
      .getSession()
      .then(({ data, error }) => {
        if (!alive) return;
        setSession(data.session);
        if (error) setError(message(error));
        setReady(true);
      })
      .catch((error) => {
        if (alive) {
          setError(message(error));
          setReady(true);
        }
      });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    let alive = true;
    setModerator(false);
    if (client && session)
      client.rpc("is_community_moderator").then(({ data }) => {
        if (alive) setModerator(data === true);
      });
    return () => {
      alive = false;
    };
  }, [client, session]);
  async function signIn() {
    if (!client) return;
    const { error } = await client.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/community/auth/` },
    });
    if (error) setError(message(error));
  }
  async function signOut() {
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) setError(message(error));
  }
  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Community" className="flex flex-wrap gap-2">
          <Link
            className={secondary}
            href="/community/"
            aria-current={view === "browse" ? "page" : undefined}
          >
            Explore
          </Link>
          <Link
            className={secondary}
            href="/community/create/"
            aria-current={view === "create" ? "page" : undefined}
          >
            Create a project
          </Link>
          <Link
            className={secondary}
            href="/community/mine/"
            aria-current={view === "mine" ? "page" : undefined}
          >
            My submissions
          </Link>
          {moderator && (
            <Link className={secondary} href="/community/moderate/">
              Review queue
            </Link>
          )}
        </nav>
        {ready &&
          client &&
          (session ? (
            <button className={secondary} onClick={signOut}>
              Sign out
            </button>
          ) : (
            <button className={button} onClick={signIn}>
              Sign in with GitHub
            </button>
          ))}
      </div>
      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-soft p-4 text-red">
          {error}
        </p>
      )}
      {!ready ? (
        <p role="status" className="my-8 text-muted">
          Connecting to the community…
        </p>
      ) : (
        <>
          {!client && (
            <div className="mt-5 rounded-2xl bg-accent-soft p-5">
              <h2 className="font-display text-xl font-bold">
                Publishing is not connected yet
              </h2>
              <p className="mt-2 text-sm text-body">
                You can try the editor, preview code, and export locally.
                Sign-in, submissions, and the public library become available
                after the site owner configures Supabase.
              </p>
            </div>
          )}
          {view === "create" && (
            <CommunityEditor client={client} session={session} />
          )}
          {(view === "browse" || view === "mine" || view === "moderate") && (
            <CommunityGallery
              client={client}
              session={session}
              view={view}
              moderator={moderator}
            />
          )}
          {view === "project" && (
            <CommunityDetail
              client={client}
              session={session}
              moderator={moderator}
            />
          )}
          {view === "auth" && (
            <section className="my-8 rounded-[28px] bg-surface p-6">
              <h2 className="font-display text-2xl font-bold">
                {session ? "You are signed in" : "Sign-in has not completed"}
              </h2>
              <p className="my-4 text-body">
                {session
                  ? "Return to the editor to load your saved local draft, or check your submissions."
                  : "Use the GitHub sign-in button to try again. If you opened this link in another browser, return to the browser where you started signing in."}
              </p>
              <Link href="/community/create/" className={button}>
                Return to the editor
              </Link>
            </section>
          )}
        </>
      )}
    </>
  );
}

function CommunityGallery({
  client,
  session,
  view,
  moderator,
}: {
  client: SupabaseClient | null;
  session: Session | null;
  view: "browse" | "mine" | "moderate";
  moderator: boolean;
}) {
  const [items, setItems] = useState<CommunitySummary[]>([]);
  const [kind, setKind] = useState("all");
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setItems([]);
    setCount(0);
    setError("");
    setLoading(false);
    if (
      !client ||
      (view !== "browse" && !session) ||
      (view === "moderate" && !moderator)
    )
      return;
    setLoading(true);
    let request = client
      .from("community_projects")
      .select(SUMMARY_COLUMNS, { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(page * 12, page * 12 + 11);
    if (view === "browse") request = request.eq("status", "approved");
    if (view === "mine") request = request.eq("owner_id", session!.user.id);
    if (view === "moderate") request = request.eq("status", "pending");
    if (kind !== "all") request = request.eq("kind", kind);
    if (search.trim())
      request = request.ilike(
        "title",
        `%${search.trim().replace(/[\\%_]/g, (value) => "\\" + value)}%`,
      );
    request.then(({ data, error, count }) => {
      if (!alive) return;
      if (error) setError(message(error));
      else {
        setItems((data ?? []) as unknown as CommunitySummary[]);
        setCount(count ?? 0);
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [client, session, view, moderator, page, kind, search]);
  if (view !== "browse" && !session)
    return (
      <p className="my-8 text-body">
        Sign in with GitHub to see your submissions
        {view === "moderate"
          ? " and access moderation if you are an appointed moderator"
          : ""}
        .
      </p>
    );
  if (view === "moderate" && !moderator)
    return (
      <p className="my-8 text-body">
        Only appointed moderators can access this queue.
      </p>
    );
  return (
    <section
      className="mt-8"
      aria-label={
        view === "mine"
          ? "Your submissions"
          : view === "moderate"
            ? "Pending review"
            : "Community projects"
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setSearch(query);
          setPage(0);
        }}
        className="flex flex-wrap items-end gap-3"
      >
        <label className="min-w-0 flex-1 text-sm font-semibold">
          Search titles
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className={field}
            maxLength={100}
            placeholder="Try a card or portfolio"
          />
        </label>
        <label className="text-sm font-semibold">
          Project type
          <select
            className={field}
            value={kind}
            onChange={(event) => {
              setKind(event.target.value);
              setPage(0);
            }}
          >
            <option value="all">All projects</option>
            <option value="component">Components</option>
            <option value="website">Website types</option>
          </select>
        </label>
        <button className={button}>Search</button>
      </form>
      <p role="status" className="my-4 text-sm text-muted">
        {loading
          ? "Loading projects…"
          : `${count} ${view === "moderate" ? "pending" : "matching"} projects`}
      </p>
      {error && (
        <p role="alert" className="mb-4 text-red">
          {error}
        </p>
      )}
      {!loading && !error && items.length === 0 && (
        <div className="rounded-[28px] bg-surface p-8">
          <h2 className="font-display text-2xl font-bold">
            {view === "browse"
              ? "No projects to show yet"
              : view === "mine"
                ? "Your next idea starts here"
                : "The review queue is clear"}
          </h2>
          <p className="mt-3 text-muted">
            {view === "browse"
              ? "Only approved submissions appear here. Try another search, or create something for the community."
              : "New submissions remain private until a moderator approves them."}
          </p>
          <Link href="/community/create/" className={`${button} mt-5`}>
            Create a project
          </Link>
        </div>
      )}
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={item.id} className="min-w-0 rounded-[28px] bg-surface p-6">
            <p className="font-mono text-xs uppercase text-accent-deep">
              {item.kind === "website" ? "Website type" : "Component"} ·{" "}
              {item.status}
            </p>
            <h2 className="mt-3 break-words font-display text-2xl font-bold">
              <Link
                className="inline-flex min-h-11 items-center hover:text-accent-deep"
                href={`/community/project/?id=${item.id}`}
              >
                {item.title}
              </Link>
            </h2>
            <p className="mt-2 break-words text-sm text-body">
              {item.description}
            </p>
            <p className="mt-4 text-sm text-muted">By @{item.author} · MIT</p>
            <ul aria-label="Tags" className="mt-3 flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-paper px-3 py-1 text-xs text-muted"
                >
                  {tag}
                </li>
              ))}
            </ul>
            <Link
              href={`/community/project/?id=${item.id}`}
              className={`${secondary} mt-5`}
            >
              View code &amp; preview →
            </Link>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex gap-3">
        <button
          className={secondary}
          disabled={page === 0 || loading}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <button
          className={secondary}
          disabled={(page + 1) * 12 >= count || loading}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}

function CommunityPreview({
  source,
  title,
}: {
  source: SampleSource;
  title: string;
}) {
  const [document, setDocument] = useState<string | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    setDocument(null);
  }, [source.html, source.css, source.js]);
  return (
    <section
      className="mt-5 rounded-2xl bg-stage p-4"
      aria-label="Project preview"
    >
      <div className="mb-3 flex flex-wrap gap-3">
        <button
          className={button}
          onClick={() => {
            try {
              setDocument(communityDocument(source, title));
              setError("");
            } catch (error) {
              setError(message(error));
            }
          }}
        >
          Run preview
        </button>
        {document && (
          <button className={secondary} onClick={() => setDocument(null)}>
            Stop preview
          </button>
        )}
      </div>
      <p className="mb-3 text-xs text-muted">
        Community code runs only when you choose. External scripts, fetch
        requests, embedded pages, popups, and form submissions are blocked. Stop
        or reload the page if a sample misbehaves.
      </p>
      {error && (
        <p role="alert" className="text-red">
          {error}
        </p>
      )}
      {document ? (
        <iframe
          title={`Preview: ${title}`}
          sandbox="allow-scripts"
          referrerPolicy="no-referrer"
          srcDoc={document}
          className="h-[500px] w-full rounded-xl border border-rule bg-surface"
        />
      ) : (
        <div className="grid h-48 place-items-center rounded-xl border border-dashed border-rule bg-surface p-6 text-center text-muted">
          Select Run preview to see this project.
        </div>
      )}
    </section>
  );
}

function CommunityEditor({
  client,
  session,
}: {
  client: SupabaseClient | null;
  session: Session | null;
}) {
  const [draft, setDraft] = useState<CommunityDraft>(() => ({
    ...EMPTY_DRAFT,
    tags: [],
  }));
  const [tagText, setTagText] = useState("");
  const [active, setActive] = useState<SampleLanguage>("html");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const revision = useRef(0);
  function change(next: Partial<CommunityDraft>) {
    revision.current++;
    setDraft((old) => ({ ...old, ...next }));
    setSubmitted(null);
    setError("");
  }
  useEffect(() => {
    const id = new URL(window.location.href).searchParams.get("remix");
    if (!id || !client) return;
    if (!isProjectId(id)) {
      setError("Invalid original project.");
      return;
    }
    const version = revision.current;
    let alive = true;
    client
      .from("community_projects")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!alive || version !== revision.current) return;
        if (error) {
          setError("The original project is unavailable.");
          return;
        }
        const project = data as CommunityProject;
        setDraft({
          html: project.html,
          css: project.css,
          js: project.js,
          title: `Remix: ${project.title}`.slice(0, 80),
          description: project.description,
          kind: project.kind,
          tags: project.tags,
          licenseAccepted: false,
          remixOf: project.id,
        });
        setTagText(project.tags.join(", "));
        setStatus(
          `Remixing a project by @${project.author}. Attribution is kept with your submission.`,
        );
      });
    return () => {
      alive = false;
    };
  }, [client]);
  async function format() {
    const size = sourceError(draft);
    if (size) {
      setError(size);
      return;
    }
    setBusy(true);
    setError("");
    const version = revision.current;
    try {
      const { formatSample } = await import("@/lib/format-sample");
      const formatted = await formatSample(draft);
      if (version === revision.current) {
        setDraft((old) => ({ ...old, ...formatted }));
        setStatus("Code formatted with Prettier.");
      } else setStatus("Newer edits kept. Format again when ready.");
    } catch (error) {
      if (version === revision.current) setError(message(error));
    } finally {
      setBusy(false);
    }
  }
  function save() {
    const size = sourceError(draft);
    if (size) {
      setError(size);
      return;
    }
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      setStatus("Draft saved in this browser. It has not been submitted.");
    } catch {
      setError("Local storage is unavailable. Export your code instead.");
    }
  }
  function load() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) {
        setStatus("No saved local draft yet.");
        return;
      }
      const value = JSON.parse(raw);
      if (
        !value ||
        !["html", "css", "js", "title", "description"].every(
          (key) => typeof value[key] === "string",
        ) ||
        !Array.isArray(value.tags) ||
        !value.tags.every((tag: unknown) => typeof tag === "string") ||
        !["component", "website"].includes(value.kind) ||
        sourceError(value)
      )
        throw new Error("Invalid draft");
      revision.current++;
      setDraft({
        ...value,
        licenseAccepted: false,
        remixOf: isProjectId(value.remixOf) ? value.remixOf : null,
      });
      setTagText(value.tags.join(", "));
      setStatus(
        "Local draft restored. Confirm the sharing license before submitting.",
      );
      setSubmitted(null);
    } catch {
      setError(
        "This saved draft could not be loaded. You can start a new project.",
      );
    }
  }
  async function submit() {
    const invalid = draftError(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (!client || !session) {
      setError(
        "Sign in with GitHub before submitting. Save your local draft before signing in.",
      );
      return;
    }
    setBusy(true);
    setError("");
    const submittedRevision = revision.current;
    const { data, error } = await client.rpc("submit_community_project", {
      p_title: draft.title.trim(),
      p_description: draft.description.trim(),
      p_kind: draft.kind,
      p_tags: [...new Set(draft.tags)],
      p_html: draft.html,
      p_css: draft.css,
      p_js: draft.js,
      p_license_accepted: draft.licenseAccepted,
      p_remix_of: draft.remixOf,
    });
    if (error) setError(message(error));
    else if (submittedRevision === revision.current) {
      setSubmitted(String(data));
      setStatus(
        "Submitted for review. Only you and moderators can see it until it is approved.",
      );
    } else {
      setStatus(
        "The earlier version was submitted for review. Your newer edits have not been submitted; view the earlier version in My submissions.",
      );
    }
    setBusy(false);
  }
  return (
    <div className="mt-8">
      <div className="grid gap-5 rounded-[28px] bg-surface p-6 md:grid-cols-2">
        <label className="text-sm font-semibold">
          Project title
          <input
            className={field}
            maxLength={80}
            value={draft.title}
            onChange={(event) => change({ title: event.target.value })}
            placeholder="Give your creation a clear name"
          />
        </label>
        <label className="text-sm font-semibold">
          Project type
          <select
            className={field}
            value={draft.kind}
            onChange={(event) =>
              change({ kind: event.target.value as CommunityDraft["kind"] })
            }
          >
            <option value="component">UI component</option>
            <option value="website">Website type</option>
          </select>
        </label>
        <label className="text-sm font-semibold md:col-span-2">
          Description
          <textarea
            className={field}
            rows={3}
            maxLength={600}
            value={draft.description}
            onChange={(event) => change({ description: event.target.value })}
            placeholder="What does it do, and when would someone use it? (20–600 characters)"
          />
        </label>
        <label className="text-sm font-semibold md:col-span-2">
          Tags (comma separated, up to 5)
          <input
            className={field}
            maxLength={164}
            value={tagText}
            onChange={(event) => {
              setTagText(event.target.value);
              change({
                tags: event.target.value
                  .split(",")
                  .map((tag) => tag.trim().toLowerCase())
                  .filter(Boolean),
              });
            }}
            placeholder="navigation, responsive, minimal"
          />
        </label>
      </div>
      <div className="my-4 flex flex-wrap gap-2">
        <button className={secondary} disabled={busy} onClick={format}>
          Format with Prettier
        </button>
        <button className={secondary} onClick={save}>
          Save local draft
        </button>
        <button className={secondary} onClick={load}>
          Load local draft
        </button>
        <button
          className={secondary}
          onClick={() => {
            try {
              downloadCommunity(draft, draft.title || "My project");
            } catch (error) {
              setError(message(error));
            }
          }}
        >
          Export HTML
        </button>
      </div>
      <div className="overflow-hidden rounded-2xl bg-code text-surface">
        <div className="flex flex-wrap border-b border-dim/30">
          {(["html", "css", "js"] as const).map((key) => (
            <button
              key={key}
              className={`min-h-11 px-5 font-mono text-sm ${active === key ? "bg-body text-hi" : "text-surface"}`}
              aria-pressed={active === key}
              onClick={() => setActive(key)}
            >
              {key.toUpperCase()} · {(byteLength(draft[key]) / 1000).toFixed(1)}{" "}
              KB
            </button>
          ))}
        </div>
        <SampleCodeEditor
          key={active}
          language={active}
          value={draft[active]}
          onChange={(value) => change({ [active]: value })}
          onBlur={() => {}}
          onCursor={() => {}}
        />
      </div>
      <p id="editor-help" className="mt-3 text-xs text-muted">
        100 KB per file, 300 KB total (UTF-8). HTML, CSS, and JavaScript only;
        no uploaded files or external libraries. Save locally before signing in.
        Tab leaves the editor.
      </p>
      <CommunityPreview source={draft} title={draft.title || "Your project"} />
      <div className="mt-6 rounded-[28px] bg-surface p-6">
        <label className="flex min-h-11 items-start gap-3 text-sm text-body">
          <input
            type="checkbox"
            className="mt-1 size-5 shrink-0 accent-accent"
            checked={draft.licenseAccepted}
            onChange={(event) =>
              change({ licenseAccepted: event.target.checked })
            }
          />
          <span>
            I own this code or have permission to share it, and agree to share
            it under the MIT license. I have checked keyboard access, readable
            contrast, and mobile layout.
          </span>
        </label>
        <p className="my-4 text-sm text-muted">
          Submissions require approval before publication. Limit:{" "}
          {COMMUNITY_LIMITS.hourlySubmissions} per hour and{" "}
          {COMMUNITY_LIMITS.dailySubmissions} per day per account. Never include
          API keys or private information.
        </p>
        <button
          className={button}
          disabled={busy || !client || !session || !!submitted}
          onClick={submit}
        >
          {busy ? "Working…" : "Submit for review"}
        </button>
        {!session && (
          <p className="mt-3 text-sm text-muted">
            Save your draft, then sign in with GitHub using the button above.
          </p>
        )}
      </div>
      {error && (
        <p
          role="alert"
          className="mt-4 break-words rounded-xl bg-red-soft p-4 text-red"
        >
          {error}
        </p>
      )}
      <p role="status" className="mt-4 text-sm text-body">
        {status}
      </p>
      {submitted && (
        <Link
          className={`${secondary} mt-3`}
          href={`/community/project/?id=${submitted}`}
        >
          View your pending submission
        </Link>
      )}
    </div>
  );
}

function CommunityDetail({
  client,
  session,
  moderator,
}: {
  client: SupabaseClient | null;
  session: Session | null;
  moderator: boolean;
}) {
  const [project, setProject] = useState<CommunityProject | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [active, setActive] = useState<SampleLanguage>("html");
  useEffect(() => {
    setProject(null);
    setError("");
    if (!client) return;
    const id = new URL(window.location.href).searchParams.get("id");
    if (!isProjectId(id)) {
      setError("Choose a project from the community library.");
      return;
    }
    let alive = true;
    client
      .from("community_projects")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (!alive) return;
        if (error)
          setError(
            "This project is unavailable or has not been approved for public viewing.",
          );
        else setProject(data as CommunityProject);
      });
    return () => {
      alive = false;
    };
  }, [client, session, refresh]);
  async function action(decision: "approved" | "rejected" | "withdrawn") {
    if (!client || !project) return;
    setBusy(true);
    setError("");
    const result =
      decision === "withdrawn"
        ? await client.rpc("withdraw_community_project", { p_id: project.id })
        : await client.rpc("review_community_project", {
            p_id: project.id,
            p_decision: decision,
            p_note: note,
          });
    if (result.error) setError(message(result.error));
    else setRefresh((value) => value + 1);
    setBusy(false);
  }
  if (!project)
    return (
      <p className="my-8 text-body" role="status">
        {error ||
          (client
            ? "Loading project…"
            : "Connect Supabase to view community submissions.")}
      </p>
    );
  return (
    <article className="mt-8">
      <div className="rounded-[28px] bg-surface p-6">
        <p className="font-mono text-xs uppercase text-accent-deep">
          {project.kind} · {project.status}
        </p>
        <h2 className="mt-3 break-words font-display text-3xl font-bold">
          {project.title}
        </h2>
        <p className="mt-3 break-words text-body">{project.description}</p>
        <p className="mt-4 text-sm text-muted">
          By @{project.author} · Shared under MIT
        </p>
        {project.remix_of && (
          <a
            className={`${secondary} mt-3`}
            href={`/community/project/?id=${project.remix_of}`}
          >
            View original project
          </a>
        )}
        {project.review_note && (
          <p className="mt-4 break-words text-body">
            Review note: {project.review_note}
          </p>
        )}
      </div>
      <CommunityPreview source={project} title={project.title} />
      <div className="my-4 flex flex-wrap gap-2">
        <Link
          className={button}
          href={`/community/create/?remix=${project.id}`}
        >
          Remix this project
        </Link>
        <button
          className={secondary}
          onClick={() => {
            try {
              downloadCommunity(project, project.title, project.author);
            } catch (error) {
              setError(message(error));
            }
          }}
        >
          Export HTML
        </button>
        <CopyButton
          text={project[active]}
          label={`Copy ${active.toUpperCase()}`}
        />
      </div>
      <div className="rounded-2xl bg-code p-4 text-surface">
        <div className="mb-3 flex gap-2">
          {(["html", "css", "js"] as const).map((key) => (
            <button
              key={key}
              className="min-h-11 rounded-lg px-4 font-mono text-sm aria-pressed:bg-body"
              aria-pressed={active === key}
              onClick={() => setActive(key)}
            >
              {key.toUpperCase()}
            </button>
          ))}
        </div>
        <pre
          tabIndex={0}
          aria-label={`${active.toUpperCase()} source`}
          className="max-h-96 overflow-auto font-mono text-xs leading-6"
        >
          {project[active]}
        </pre>
      </div>
      {session?.user.id === project.owner_id &&
        project.status !== "withdrawn" && (
          <button
            disabled={busy}
            className={`${secondary} mt-5`}
            onClick={() => action("withdrawn")}
          >
            Withdraw submission
          </button>
        )}
      {moderator &&
        (project.status === "pending" || project.status === "approved") && (
          <section
            className="mt-6 rounded-[28px] bg-surface p-6"
            aria-label="Moderation"
          >
            <h3 className="font-display text-xl font-bold">
              Review this submission
            </h3>
            <p className="my-3 text-sm text-body">
              Review the source before running it. Check originality, licensing,
              accessibility, prohibited behavior, and the mobile layout.
              Approval makes the code public.
            </p>
            <label className="text-sm font-semibold">
              Note to the author (shown when rejected)
              <textarea
                className={field}
                maxLength={500}
                value={note}
                onChange={(event) => setNote(event.target.value)}
              />
            </label>
            <div className="mt-4 flex gap-3">
              {project.status === "pending" && (
                <button
                  disabled={busy}
                  className={button}
                  onClick={() => action("approved")}
                >
                  Approve &amp; publish
                </button>
              )}
              <button
                disabled={busy}
                className={secondary}
                onClick={() => action("rejected")}
              >
                {project.status === "approved" ? "Unpublish" : "Reject"}
              </button>
            </div>
          </section>
        )}
      {error && (
        <p role="alert" className="mt-4 text-red">
          {error}
        </p>
      )}
    </article>
  );
}
