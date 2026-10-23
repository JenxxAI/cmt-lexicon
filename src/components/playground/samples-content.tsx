import { useEffect, useRef, useState } from "react";
import styles from "./Playground.module.css";
import { BOX_RADIUS, boxRadiusControl, colorControl, tone } from "./tones";
import { bool, num, str, type Sample, type Values } from "./types";

const choice = (key: string, label: string, def: string, options: [string, string][]) => ({ type: "choice" as const, key, label, default: def, options: options.map(([value, text]) => ({ value, label: text })) });
const stop = (event: { preventDefault: () => void }) => event.preventDefault();
const check = <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 8.5l3.2 3L13 4.5" /></svg>;

/* ---------- Breadcrumb ---------- */

const TRAIL = ["Home", "Shop", "Shoes", "Running", "Trail"];

function BreadcrumbDemo({ v }: { v: Values }) {
  const [went, setWent] = useState("");
  const [expanded, setExpanded] = useState(false);
  const t = tone(str(v, "color"));
  const items = TRAIL.slice(0, num(v, "depth"));
  const collapsed = bool(v, "collapse") && !expanded && items.length > 3;
  const shown: (string | null)[] = collapsed ? [items[0], null, ...items.slice(-2)] : items;
  const sep = str(v, "separator");
  const separator = (
    <span aria-hidden="true" className="px-1 text-muted">
      {sep === "slash" ? "/" : sep === "dot" ? "•" : <svg viewBox="0 0 16 16" className="inline size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3l5 5-5 5" /></svg>}
    </span>
  );
  return (
    <div className="w-full max-w-md">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center text-sm">
          {shown.map((name, i) => {
            const last = i === shown.length - 1;
            return (
              <li key={name ?? "gap"} className="flex items-center">
                {name === null ? (
                  <button type="button" aria-label="Show the full path" onClick={() => setExpanded(true)} className="grid min-h-11 min-w-11 place-items-center rounded-full hover:bg-line">…</button>
                ) : last ? (
                  <span aria-current="page" className="px-1 font-semibold">{name}</span>
                ) : (
                  <a href="#" onClick={(e) => { stop(e); setWent(name); }} className={`inline-flex min-h-11 items-center px-1 font-medium underline-offset-4 hover:underline ${t.text}`}>{name}</a>
                )}
                {!last && separator}
              </li>
            );
          })}
        </ol>
      </nav>
      <p aria-live="polite" className="mt-2 text-sm text-muted">{went ? `You went to ${went}` : "Click a parent page"}</p>
    </div>
  );
}

/* ---------- Empty state ---------- */

function EmptyDemo({ v }: { v: Values }) {
  const [made, setMade] = useState(false);
  const [note, setNote] = useState("");
  const t = tone(str(v, "color"));
  const left = str(v, "align") === "left";
  const art = str(v, "art");
  const box = `w-full max-w-sm bg-surface p-6 ${BOX_RADIUS[str(v, "radius")]}`;
  if (made) {
    return (
      <div className={box}>
        <p className="font-display text-lg font-bold">Projects</p>
        <div className={`mt-3 flex items-center gap-3 rounded-2xl p-3 ${t.soft}`}><span aria-hidden="true" className={`grid size-9 place-items-center rounded-full ${t.solid}`}>{check}</span>My first project</div>
        <button type="button" onClick={() => { setMade(false); setNote(""); }} className="mt-4 min-h-11 rounded-full bg-line px-5 text-sm font-medium hover:bg-rule">Start over</button>
      </div>
    );
  }
  return (
    <div className={`${box} flex flex-col ${left ? "items-start text-left" : "items-center text-center"}`}>
      {art === "icon" && <span aria-hidden="true" className={`grid size-16 place-items-center rounded-full ${t.soft}`}><svg viewBox="0 0 24 24" className="size-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 13l2.5-7h11L20 13M4 13v6h16v-6M4 13h4.5l1 2h5l1-2H20" /></svg></span>}
      {art === "blob" && <span aria-hidden="true" className={`size-20 rounded-[42%_58%_55%_45%/50%_45%_55%_50%] ${t.grad}`} />}
      <h4 className="mt-4 font-display text-xl font-bold">{str(v, "title") || "Nothing here"}</h4>
      <p className="mt-1 text-sm text-body">{str(v, "body")}</p>
      <div className={`mt-4 flex flex-wrap gap-2 ${left ? "" : "justify-center"}`}>
        {bool(v, "primary") && <button type="button" onClick={() => setMade(true)} className={`min-h-11 rounded-full px-5 text-sm font-semibold hover:opacity-85 ${t.solid}`}>Create project</button>}
        {bool(v, "secondary") && <button type="button" onClick={() => setNote("The docs would open here")} className="min-h-11 rounded-full bg-line px-5 text-sm font-medium hover:bg-rule">Learn more</button>}
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-xs text-muted">{note}</p>
    </div>
  );
}

/* ---------- Stepper ---------- */

const STEPS = [["Account", "Create your login"], ["Profile", "Tell us about you"], ["Plan", "Pick a plan"], ["Review", "Check the details"], ["Payment", "Add a card"], ["Done", "You are set"]];

function StepperDemo({ v }: { v: Values }) {
  const count = num(v, "steps");
  const [step, setStep] = useState(1);
  const t = tone(str(v, "color"));
  const vertical = str(v, "direction") === "vertical";
  const dots = str(v, "marker") === "dots";
  const current = Math.min(step, count - 1);
  const clickable = bool(v, "clickable");

  const marker = (i: number) => {
    const done = i < current;
    const now = i === current;
    const face = dots ? "" : done ? check : i + 1;
    const cls = `grid shrink-0 place-items-center rounded-full text-sm font-bold ${dots ? "size-5" : "size-10"} ${done || now ? t.solid : "border-2 border-dim bg-surface text-muted"} ${now ? "ring-4 ring-black/10" : ""}`;
    return <span aria-hidden="true" className={cls}>{dots && done ? "" : face}</span>;
  };

  return (
    <div className="w-full max-w-md">
      <ol className={vertical ? "flex flex-col" : "flex"}>
        {STEPS.slice(0, count).map(([name, sub], i) => {
          const done = i < current;
          const inner = (
            <>
              {marker(i)}
              <span className={vertical ? "min-w-0 text-left" : "mt-2 block px-1 text-center"}>
                <span className={`block text-sm ${i === current ? "font-bold" : "font-medium"} ${i > current ? "text-muted" : ""}`}>{name}</span>
                {vertical && <span className="block text-xs text-muted">{sub}</span>}
              </span>
            </>
          );
          const layout = vertical ? "flex items-start gap-3 text-left" : "flex flex-col items-center";
          return (
            <li key={name} aria-current={i === current ? "step" : undefined} className={`relative ${vertical ? "pb-5" : "flex-1"}`}>
              {i < count - 1 && (
                <span aria-hidden="true" className={`absolute ${vertical ? "w-0.5" : "h-0.5 w-full"} ${done ? t.fill : "bg-rule"}`} style={vertical ? { left: dots ? 9 : 19, top: dots ? 22 : 42, height: "calc(100% - 2.75rem)" } : { top: dots ? 10 : 20, left: "50%" }} />
              )}
              {clickable && done ? (
                <button type="button" onClick={() => setStep(i)} className={`relative min-h-11 w-full ${layout}`}>{inner}<span className="sr-only">(completed, go back)</span></button>
              ) : (
                <div className={`relative ${layout}`}>{inner}{done && <span className="sr-only">(completed)</span>}</div>
              )}
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" disabled={current === 0} onClick={() => setStep(current - 1)} className="min-h-11 rounded-full bg-line px-5 text-sm font-medium hover:bg-rule disabled:cursor-not-allowed disabled:opacity-50">Back</button>
        <p aria-live="polite" className="text-sm text-muted">Step {current + 1} of {count}</p>
        <button type="button" disabled={current === count - 1} onClick={() => setStep(current + 1)} className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-body disabled:cursor-not-allowed disabled:opacity-50">{current === count - 2 ? "Finish" : "Next"}</button>
      </div>
    </div>
  );
}

/* ---------- Skeleton loader ---------- */

function SkeletonDemo({ v }: { v: Values }) {
  const [phase, setPhase] = useState<"skeleton" | "loading" | "loaded">("skeleton");
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const kind = str(v, "kind");
  const anim = str(v, "animation");
  const box = `${anim === "pulse" ? "motion-safe:animate-pulse" : anim === "shimmer" ? styles.shimmer : ""} ${anim === "shimmer" ? "" : "bg-skel-soft"}`;
  const r = BOX_RADIUS[str(v, "radius")];
  const lines = num(v, "lines");
  const showSkeleton = phase !== "loaded";

  function load() {
    setPhase("loading");
    timer.current = window.setTimeout(() => setPhase("loaded"), 1500);
  }

  const bar = (w: string, h = "h-3") => <div className={`${h} rounded-full ${box}`} style={{ width: w }} />;
  const skeleton =
    kind === "card" ? (
      <div className="space-y-3"><div className={`h-28 ${r} ${box}`} />{bar("70%", "h-4")}{bar("90%")}{bar("55%")}</div>
    ) : kind === "list" ? (
      <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="flex items-center gap-3"><div className={`size-12 shrink-0 rounded-full ${box}`} /><div className="flex-1 space-y-2">{bar("60%", "h-4")}{bar("85%")}</div></div>)}</div>
    ) : (
      <div className="space-y-3">{Array.from({ length: lines }, (_, i) => <div key={i}>{bar(i === lines - 1 ? "55%" : "100%")}</div>)}</div>
    );
  const content =
    kind === "card" ? (
      <div className="space-y-2"><div className={`h-28 ${r} bg-accent-soft`} /><p className="font-display text-lg font-bold">Weekend in Baguio</p><p className="text-sm text-body">Pine trees, strawberry taho, and cool mornings.</p></div>
    ) : kind === "list" ? (
      <ul className="space-y-3">{["Ana Reyes", "Ben Cruz", "Cathy Lim"].map((n) => <li key={n} className="flex items-center gap-3"><span aria-hidden="true" className="grid size-12 place-items-center rounded-full bg-ink font-bold text-white">{n[0]}</span><span><span className="block font-semibold">{n}</span><span className="block text-sm text-muted">Last seen today</span></span></li>)}</ul>
    ) : (
      <div className="space-y-2 text-sm text-body">{Array.from({ length: lines }, (_, i) => <p key={i}>{i === 0 ? "Skeletons hold the page's shape while data loads, so nothing jumps when it arrives." : "More text appears in the same place the gray bars were."}</p>)}</div>
    );

  return (
    <div className={`w-full max-w-sm bg-surface p-5 ${r}`} aria-busy={showSkeleton}>
      <div aria-live="polite">{showSkeleton ? <><span className="sr-only">Loading content…</span><div aria-hidden="true">{skeleton}</div></> : content}</div>
      <div className="mt-4 flex gap-2">
        {phase === "skeleton" && <button type="button" onClick={load} className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-body">Load content</button>}
        {phase === "loading" && <span className="inline-flex min-h-11 items-center text-sm text-muted">Loading…</span>}
        {phase === "loaded" && <button type="button" onClick={() => setPhase("skeleton")} className="min-h-11 rounded-full bg-line px-5 text-sm font-medium hover:bg-rule">Show skeleton again</button>}
      </div>
    </div>
  );
}

/* ---------- Data table ---------- */

type Row = { name: string; role: string; status: "Active" | "Away" | "Invited"; amount: number };
const ROWS: Row[] = [
  { name: "Ana Reyes", role: "Designer", status: "Active", amount: 4200 },
  { name: "Ben Cruz", role: "Engineer", status: "Away", amount: 5100 },
  { name: "Cathy Lim", role: "Manager", status: "Active", amount: 6400 },
  { name: "Dan Ortiz", role: "QA", status: "Invited", amount: 3800 },
  { name: "Eli Santos", role: "Engineer", status: "Active", amount: 5300 },
  { name: "Faye Ramos", role: "Support", status: "Away", amount: 3100 },
  { name: "Gio Tan", role: "Designer", status: "Active", amount: 4500 },
  { name: "Hana Diaz", role: "Analyst", status: "Invited", amount: 3900 },
];
const COLS: { key: keyof Row; label: string; right?: boolean }[] = [{ key: "name", label: "Name" }, { key: "role", label: "Role" }, { key: "status", label: "Status" }, { key: "amount", label: "Salary", right: true }];

function TableDemo({ v }: { v: Values }) {
  const [sort, setSort] = useState<{ key: keyof Row; dir: "asc" | "desc" } | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const t = tone(str(v, "color"));
  const pad = { compact: "py-1", normal: "py-3", roomy: "py-5" }[str(v, "density")];
  const sortable = bool(v, "sortable");
  const selectable = bool(v, "selectable");
  let rows = ROWS.slice(0, num(v, "rows"));
  if (sortable && sort) {
    const { key, dir } = sort;
    rows = [...rows].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * (dir === "asc" ? 1 : -1));
  }
  const allPicked = rows.length > 0 && rows.every((r) => picked.has(r.name));
  const toggle = (name: string) => setPicked((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const cycle = (key: keyof Row) => setSort((s) => (s?.key !== key ? { key, dir: "asc" } : s.dir === "asc" ? { key, dir: "desc" } : null));
  const cell = `px-3 ${pad}`;

  return (
    <div role="region" aria-label="Team table" tabIndex={0} className={`w-full max-w-lg overflow-x-auto bg-surface ${BOX_RADIUS[str(v, "radius")]}`}>
      <table className="w-full min-w-[30rem] text-left text-sm">
        <caption className="sr-only">Team members{sortable ? ". Column headers sort the table." : ""}</caption>
        <thead className="bg-paper font-mono text-xs uppercase text-muted">
          <tr>
            {selectable && <th scope="col" className="w-12 px-1"><label className="grid min-h-11 min-w-11 cursor-pointer place-items-center"><input type="checkbox" aria-label="Select all rows" checked={allPicked} onChange={() => setPicked(allPicked ? new Set() : new Set(rows.map((r) => r.name)))} className="size-5" style={{ accentColor: t.css }} /></label></th>}
            {COLS.map((c) => (
              <th key={c.key} scope="col" aria-sort={sortable && sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined} className={`px-3 ${c.right ? "text-right" : ""}`}>
                {sortable ? <button type="button" onClick={() => cycle(c.key)} className={`inline-flex min-h-11 items-center gap-1 font-mono uppercase hover:text-ink ${c.right ? "flex-row-reverse" : ""}`}>{c.label}<span aria-hidden="true">{sort?.key === c.key ? (sort.dir === "asc" ? "↑" : "↓") : "↕"}</span></button> : <span className="inline-flex min-h-11 items-center">{c.label}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const on = picked.has(r.name);
            return (
              <tr key={r.name} className={`${on ? t.soft : bool(v, "striped") && i % 2 === 1 ? "bg-paper" : ""} ${bool(v, "hover") && !on ? "hover:bg-line" : ""}`}>
                {selectable && <td className="px-1"><label className="grid min-h-11 min-w-11 cursor-pointer place-items-center"><input type="checkbox" aria-label={`Select ${r.name}`} checked={on} onChange={() => toggle(r.name)} className="size-5" style={{ accentColor: t.css }} /></label></td>}
                <th scope="row" className={`${cell} font-semibold`}>{r.name}</th>
                <td className={cell}>{r.role}</td>
                <td className={cell}><span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.status === "Active" ? "bg-green-soft text-green" : r.status === "Away" ? "bg-accent-soft text-accent-deep" : "bg-line text-body"}`}>{r.status}</span></td>
                <td className={`${cell} text-right font-mono`}>₱{r.amount.toLocaleString("en-US")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export const CONTENT_SAMPLES = {
  breadcrumb: {
    hint: "Click a parent page. With 4+ levels, collapse the middle into …",
    controls: [{ type: "range", key: "depth", label: "Levels", min: 2, max: 5, step: 1, default: 4 }, choice("separator", "Separator", "chevron", [["chevron", "Chevron"], ["slash", "Slash"], ["dot", "Dot"]]), colorControl("ink"), { type: "toggle", key: "collapse", label: "Collapse the middle", default: false }],
    render: (v) => <BreadcrumbDemo v={v} />,
  },
  "empty-state": {
    hint: "Press Create project to leave the empty state.",
    controls: [{ type: "text", key: "title", label: "Title", default: "No projects yet", maxLength: 32 }, { type: "text", key: "body", label: "Message", default: "Create your first project to get started.", maxLength: 80 }, choice("art", "Picture", "icon", [["none", "None"], ["icon", "Icon"], ["blob", "Blob"]]), choice("align", "Alignment", "center", [["center", "Center"], ["left", "Left"]]), colorControl("orange"), boxRadiusControl("xl"), { type: "toggle", key: "primary", label: "Main button", default: true }, { type: "toggle", key: "secondary", label: "Second button", default: true }],
    render: (v) => <EmptyDemo v={v} />,
  },
  stepper: {
    hint: "Use Back and Next. Turn on Clickable to jump back to finished steps.",
    controls: [{ type: "range", key: "steps", label: "Steps", min: 3, max: 6, step: 1, default: 4 }, choice("direction", "Direction", "horizontal", [["horizontal", "Horizontal"], ["vertical", "Vertical"]]), choice("marker", "Marker", "numbers", [["numbers", "Numbers"], ["dots", "Dots"]]), colorControl("ink"), { type: "toggle", key: "clickable", label: "Clickable steps", default: true }],
    render: (v) => <StepperDemo v={v} />,
  },
  "skeleton-loader": {
    hint: "Press Load content to swap the gray shapes for real content.",
    controls: [choice("kind", "Shape", "lines", [["lines", "Text lines"], ["card", "Card"], ["list", "List"]]), choice("animation", "Animation", "pulse", [["pulse", "Pulse"], ["shimmer", "Shimmer"], ["none", "None"]]), boxRadiusControl("round"), { type: "range", key: "lines", label: "Text lines", min: 2, max: 6, step: 1, default: 4 }],
    render: (v) => <SkeletonDemo v={v} />,
  },
  "data-table": {
    hint: "Click a column header to sort. Tick rows to select them.",
    controls: [choice("density", "Density", "normal", [["compact", "Compact"], ["normal", "Normal"], ["roomy", "Roomy"]]), colorControl("ink"), boxRadiusControl("round"), { type: "range", key: "rows", label: "Rows", min: 3, max: 8, step: 1, default: 5 }, { type: "toggle", key: "sortable", label: "Sortable", default: true }, { type: "toggle", key: "selectable", label: "Row checkboxes", default: false }, { type: "toggle", key: "striped", label: "Striped rows", default: false }, { type: "toggle", key: "hover", label: "Highlight on hover", default: true }],
    render: (v) => <TableDemo v={v} />,
  },
} satisfies Record<string, Sample>;
