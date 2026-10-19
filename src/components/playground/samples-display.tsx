import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { RADIUS, colorControl, radiusControl, sizeControl, tone } from "./tones";
import { bool, num, str, type Sample, type Values } from "./types";

/* ---------- Tabs ---------- */

const TAB_NAMES = ["Overview", "Details", "Reviews", "Pricing", "FAQ"];

function TabsDemo({ v }: { v: Values }) {
  const count = num(v, "count");
  const [active, setActive] = useState(0);
  const base = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = Math.min(active, count - 1);
  const style = str(v, "style");
  const fill = bool(v, "fill");

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    let next = current;
    if (event.key === "ArrowRight") next = (current + 1) % count;
    else if (event.key === "ArrowLeft") next = (current - 1 + count) % count;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = count - 1;
    else return;
    event.preventDefault();
    setActive(next);
    refs.current[next]?.focus();
  }

  const list = style === "underline" ? "border-b border-rule" : style === "boxed" ? "gap-1 rounded-2xl bg-line p-1" : "gap-1";
  const tab = (selected: boolean) =>
    style === "underline" ? `-mb-px border-b-2 ${selected ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`
    : style === "boxed" ? `rounded-xl ${selected ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink"}`
    : `rounded-full ${selected ? "bg-ink text-white" : "text-ink hover:bg-line"}`;

  return (
    <div className="w-full max-w-md">
      <div role="tablist" aria-label="Product sections" className={`flex ${list}`}>
        {TAB_NAMES.slice(0, count).map((name, index) => (
          <button
            key={name}
            ref={(el) => { refs.current[index] = el; }}
            id={`${base}-tab-${index}`}
            role="tab"
            type="button"
            aria-selected={current === index}
            aria-controls={`${base}-panel-${index}`}
            tabIndex={current === index ? 0 : -1}
            onClick={() => setActive(index)}
            onKeyDown={onKeyDown}
            className={`min-h-11 px-4 text-sm font-semibold transition-colors motion-reduce:transition-none ${fill ? "flex-1" : ""} ${tab(current === index)}`}
          >
            {name}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`${base}-panel-${current}`}
        aria-labelledby={`${base}-tab-${current}`}
        tabIndex={0}
        className="mt-3 rounded-2xl bg-surface p-4 text-sm text-body"
      >
        <strong className="font-display text-base text-ink">{TAB_NAMES[current]}</strong>
        <p className="mt-1">Only one panel is visible at a time. Use the arrow keys, Home, and End to move between tabs.</p>
      </div>
    </div>
  );
}

/* ---------- Accordion ---------- */

const ITEMS = [
  ["What is an accordion?", "A stack of headings that each expand to reveal more content."],
  ["When should I use one?", "When content is long and most people only need one or two parts of it."],
  ["Can several stay open?", "Yes. Switch the mode to Multiple and open more than one."],
  ["Is it keyboard friendly?", "Each heading is a real button, so Tab and Enter or Space work."],
  ["Does it hide content from search?", "Closed content is hidden from screen readers too, so keep headings clear."],
];

function AccordionDemo({ v }: { v: Values }) {
  const count = num(v, "count");
  const [open, setOpen] = useState<number[]>([0]);
  const base = useId();
  const multiple = str(v, "mode") === "multiple";
  const shown = (multiple ? open : open.slice(0, 1)).filter((i) => i < count);
  const cards = str(v, "style") === "cards";
  const plus = str(v, "icon") === "plus";

  function toggle(index: number) {
    if (multiple) setOpen(shown.includes(index) ? shown.filter((i) => i !== index) : [...shown, index]);
    else setOpen(shown.includes(index) ? [] : [index]);
  }

  return (
    <div className={`w-full max-w-md ${cards ? "flex flex-col gap-2" : "divide-y divide-rule rounded-2xl bg-surface px-4"}`}>
      {ITEMS.slice(0, count).map(([title, body], index) => {
        const isOpen = shown.includes(index);
        return (
          <div key={title} className={cards ? "rounded-2xl bg-surface px-4" : ""}>
            <h4>
              <button
                type="button"
                id={`${base}-h-${index}`}
                aria-expanded={isOpen}
                aria-controls={`${base}-p-${index}`}
                onClick={() => toggle(index)}
                className="flex min-h-12 w-full items-center justify-between gap-3 text-left text-[15px] font-semibold"
              >
                {title}
                <svg aria-hidden="true" viewBox="0 0 16 16" className={`size-4 shrink-0 transition-transform motion-reduce:transition-none ${!plus && isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {plus ? <path d={isOpen ? "M3 8h10" : "M8 3v10M3 8h10"} /> : <path d="M3 6l5 5 5-5" />}
                </svg>
              </button>
            </h4>
            <div id={`${base}-p-${index}`} role="region" aria-labelledby={`${base}-h-${index}`} hidden={!isOpen} className="pb-4 text-sm text-body">
              {body}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- Tooltip ---------- */

const PLACE: Record<string, { box: string; arrow: string }> = {
  top: { box: "bottom-full left-1/2 mb-2 -translate-x-1/2", arrow: "-bottom-1 left-1/2 -ml-1" },
  bottom: { box: "left-1/2 top-full mt-2 -translate-x-1/2", arrow: "-top-1 left-1/2 -ml-1" },
  left: { box: "right-full top-1/2 mr-2 -translate-y-1/2", arrow: "-right-1 top-1/2 -mt-1" },
  right: { box: "left-full top-1/2 ml-2 -translate-y-1/2", arrow: "-left-1 top-1/2 -mt-1" },
};

function TooltipDemo({ v }: { v: Values }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const id = useId();
  const place = PLACE[str(v, "placement")];
  const dark = str(v, "theme") === "dark";
  const look = dark ? "bg-ink text-white" : "bg-surface text-ink shadow-lg";

  useEffect(() => () => window.clearTimeout(timer.current), []);
  const show = () => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(true), num(v, "delay"));
  };
  const hide = () => {
    window.clearTimeout(timer.current);
    setOpen(false);
  };

  return (
    <div className="px-10 py-8">
      <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide} onKeyDown={(event) => event.key === "Escape" && hide()}>
        <button type="button" aria-describedby={id} className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-body">
          Hover or focus me
        </button>
        <span role="tooltip" id={id} hidden={!open} className={`absolute z-10 w-max max-w-56 rounded-lg px-3 py-2 text-sm ${look} ${place.box}`}>
          {str(v, "text") || "Tooltip"}
          {bool(v, "arrow") && <span aria-hidden="true" className={`absolute size-2 rotate-45 ${dark ? "bg-ink" : "bg-surface"} ${place.arrow}`} />}
        </span>
      </span>
    </div>
  );
}

/* ---------- Progress bar ---------- */

const BAR_HEIGHT: Record<string, string> = { sm: "h-2", md: "h-3", lg: "h-5" };

function ProgressDemo({ v }: { v: Values }) {
  const target = num(v, "value");
  const [value, setValue] = useState(target);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setValue(target);
    setRunning(false);
  }, [target]);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => setValue((p) => (p >= 100 ? 0 : Math.min(100, p + 4))), 250);
    return () => window.clearInterval(timer);
  }, [running]);

  const radius = str(v, "radius") === "pill" ? "rounded-full" : "rounded-none";
  return (
    <div className="w-full max-w-sm">
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span id="progress-label" className="font-display text-base font-bold">Uploading photos</span>
        {bool(v, "showPercent") && <span className="font-mono">{value}%</span>}
      </div>
      <div role="progressbar" aria-labelledby="progress-label" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className={`overflow-hidden bg-skel-soft ${BAR_HEIGHT[str(v, "size")]} ${radius}`}>
        <div
          className={`h-full transition-[width] duration-200 motion-reduce:transition-none ${tone(str(v, "color")).fill} ${radius}`}
          style={{
            width: `${value}%`,
            backgroundImage: bool(v, "striped") ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.35) 0 8px, transparent 8px 16px)" : undefined,
          }}
        />
      </div>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={() => setRunning((r) => !r)} className="min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-body">
          {running ? "Pause" : "Auto-run"}
        </button>
        <button type="button" onClick={() => { setRunning(false); setValue(0); }} className="min-h-11 rounded-full bg-line px-5 text-sm font-medium hover:bg-rule">Start over</button>
      </div>
    </div>
  );
}

/* ---------- Spinner ---------- */

const SPIN: Record<string, number> = { sm: 20, md: 32, lg: 52 };

function SpinnerDemo({ v }: { v: Values }) {
  const px = SPIN[str(v, "size")];
  const t = tone(str(v, "color"));
  const speed = `${num(v, "speed")}s`;
  const kind = str(v, "kind");
  return (
    <div role="status" className={`flex items-center gap-3 ${t.text}`}>
      {kind === "ring" && <span aria-hidden="true" className="block rounded-full border-current border-t-transparent motion-safe:animate-spin" style={{ width: px, height: px, borderWidth: Math.max(2, px / 8), animationDuration: speed }} />}
      {kind === "dots" && (
        <span aria-hidden="true" className="flex items-end gap-1.5" style={{ height: px }}>
          {[0, 1, 2].map((i) => <span key={i} className="block rounded-full bg-current motion-safe:animate-bounce" style={{ width: px / 3, height: px / 3, animationDuration: speed, animationDelay: `${i * 0.15}s` }} />)}
        </span>
      )}
      {kind === "bars" && (
        <span aria-hidden="true" className="flex items-center gap-1" style={{ height: px }}>
          {[0, 1, 2, 3].map((i) => <span key={i} className="block rounded-full bg-current motion-safe:animate-pulse" style={{ width: Math.max(3, px / 7), height: px, animationDuration: speed, animationDelay: `${i * 0.12}s` }} />)}
        </span>
      )}
      <span className={bool(v, "label") ? "text-base font-medium text-ink" : "sr-only"}>Loading…</span>
    </div>
  );
}

/* ---------- Avatar ---------- */

const AVATAR: Record<string, { box: string; text: string; dot: string }> = {
  sm: { box: "size-10", text: "text-sm", dot: "size-3" },
  md: { box: "size-14", text: "text-lg", dot: "size-4" },
  lg: { box: "size-20", text: "text-2xl", dot: "size-5" },
  xl: { box: "size-28", text: "text-4xl", dot: "size-6" },
};
const STATUS: Record<string, { cls: string; label: string }> = {
  online: { cls: "bg-green", label: "Online" },
  away: { cls: "bg-accent-deep", label: "Away" },
  busy: { cls: "bg-red", label: "Busy" },
};
const initials = (name: string) => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("") || "?";
const PEOPLE = ["Ana Reyes", "Ben Cruz", "Cathy Lim", "Dan Ortiz"];
const GROUP_TONES = ["blue", "green", "orange", "red"];

function AvatarDemo({ v }: { v: Values }) {
  const size = AVATAR[str(v, "size")];
  const shape = str(v, "shape") === "circle" ? "rounded-full" : str(v, "shape") === "rounded" ? "rounded-2xl" : "rounded-md";
  const status = STATUS[str(v, "status")];
  const one = (name: string, color: string, withStatus: boolean, ring: boolean) => (
    <span key={name} className="relative inline-flex">
      <span role="img" aria-label={name} className={`grid place-items-center font-display font-bold ${size.box} ${size.text} ${shape} ${tone(color).solid} ${ring ? "ring-2 ring-stage" : ""}`}>
        {initials(name)}
      </span>
      {withStatus && status && (
        <span className={`absolute -bottom-0.5 -right-0.5 rounded-full ring-2 ring-stage ${size.dot} ${status.cls}`}>
          <span className="sr-only">{status.label}</span>
        </span>
      )}
    </span>
  );

  if (bool(v, "group")) {
    return (
      <div className="flex items-center -space-x-3">
        {PEOPLE.map((p, i) => one(p, GROUP_TONES[i], false, true))}
        <span className={`grid place-items-center bg-line font-semibold ring-2 ring-stage ${size.box} ${size.text} ${shape}`}>+3</span>
      </div>
    );
  }
  return one(str(v, "name") || "?", str(v, "color"), true, false);
}

/* ---------- Pagination ---------- */

const span = (a: number, b: number) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

function pageItems(current: number, total: number, siblings: number): (number | "gap")[] {
  if (total <= siblings * 2 + 5) return span(1, total);
  const left = Math.max(current - siblings, 1);
  const right = Math.min(current + siblings, total);
  const gapLeft = left > 2;
  const gapRight = right < total - 1;
  const edge = 3 + siblings * 2;
  if (!gapLeft && gapRight) return [...span(1, edge), "gap", total];
  if (gapLeft && !gapRight) return [1, "gap", ...span(total - edge + 1, total)];
  return [1, "gap", ...span(left, right), "gap", total];
}

function PaginationDemo({ v }: { v: Values }) {
  const total = num(v, "pages");
  const [picked, setPicked] = useState(1);
  const page = Math.min(picked, total);
  const radius = RADIUS[str(v, "radius")];
  const outline = str(v, "style") === "outline";
  const item = "grid min-h-11 min-w-11 place-items-center px-2 text-sm font-semibold transition-colors motion-reduce:transition-none";
  const idle = outline ? "border border-rule bg-surface hover:bg-line" : "hover:bg-line";
  const arrow = (label: string, to: number, disabled: boolean, glyph: string) => (
    <li>
      <button type="button" aria-label={label} disabled={disabled} onClick={() => setPicked(to)} className={`${item} ${radius} ${idle} disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent`}>
        <span aria-hidden="true">{glyph}</span>
      </button>
    </li>
  );

  return (
    <nav aria-label="Search results pages">
      <ul className="flex flex-wrap items-center justify-center gap-1">
        {bool(v, "arrows") && arrow("Previous page", page - 1, page === 1, "‹")}
        {pageItems(page, total, num(v, "siblings")).map((entry, index) =>
          entry === "gap" ? (
            <li key={`gap-${index}`} aria-hidden="true" className="grid min-h-11 min-w-8 place-items-center text-muted">…</li>
          ) : (
            <li key={entry}>
              <button type="button" aria-label={`Page ${entry}`} aria-current={entry === page ? "page" : undefined} onClick={() => setPicked(entry)} className={`${item} ${radius} ${entry === page ? "bg-ink text-white" : idle}`}>
                {entry}
              </button>
            </li>
          ),
        )}
        {bool(v, "arrows") && arrow("Next page", page + 1, page === total, "›")}
      </ul>
      <p aria-live="polite" className="mt-3 text-center text-sm text-muted">Page {page} of {total}</p>
    </nav>
  );
}

export const DISPLAY_SAMPLES = {
  tabs: {
    hint: "Click a tab, or use the arrow keys, Home, and End.",
    controls: [
      { type: "choice", key: "style", label: "Style", default: "underline", options: [{ value: "underline", label: "Underline" }, { value: "pill", label: "Pill" }, { value: "boxed", label: "Boxed" }] },
      { type: "range", key: "count", label: "Number of tabs", min: 2, max: 5, step: 1, default: 3 },
      { type: "toggle", key: "fill", label: "Stretch to full width", default: false },
    ],
    render: (v) => <TabsDemo v={v} />,
  },
  accordion: {
    hint: "Open and close sections. Switch to Multiple to keep several open.",
    controls: [
      { type: "choice", key: "mode", label: "Mode", default: "single", options: [{ value: "single", label: "One at a time" }, { value: "multiple", label: "Multiple" }] },
      { type: "choice", key: "style", label: "Style", default: "divided", options: [{ value: "divided", label: "Divided" }, { value: "cards", label: "Cards" }] },
      { type: "choice", key: "icon", label: "Icon", default: "chevron", options: [{ value: "chevron", label: "Chevron" }, { value: "plus", label: "Plus / minus" }] },
      { type: "range", key: "count", label: "Number of items", min: 2, max: 5, step: 1, default: 3 },
    ],
    render: (v) => <AccordionDemo v={v} />,
  },
  tooltip: {
    hint: "Hover or Tab to the button. Press Escape to dismiss.",
    controls: [
      { type: "text", key: "text", label: "Tooltip text", default: "Saves your work", maxLength: 40 },
      { type: "choice", key: "placement", label: "Placement", default: "top", options: [{ value: "top", label: "Top" }, { value: "bottom", label: "Bottom" }, { value: "left", label: "Left" }, { value: "right", label: "Right" }] },
      { type: "choice", key: "theme", label: "Theme", default: "dark", options: [{ value: "dark", label: "Dark" }, { value: "light", label: "Light" }] },
      { type: "range", key: "delay", label: "Delay", min: 0, max: 1000, step: 100, default: 200, unit: "ms" },
      { type: "toggle", key: "arrow", label: "Arrow", default: true },
    ],
    render: (v) => <TooltipDemo v={v} />,
  },
  "progress-bar": {
    hint: "Press Auto-run, or drag the Value setting.",
    controls: [
      { type: "range", key: "value", label: "Value", min: 0, max: 100, step: 5, default: 45, unit: "%" },
      colorControl("ink"),
      sizeControl("md"),
      radiusControl("pill"),
      { type: "toggle", key: "striped", label: "Striped", default: false },
      { type: "toggle", key: "showPercent", label: "Show percent", default: true },
    ],
    render: (v) => <ProgressDemo v={v} />,
  },
  spinner: {
    hint: "Spinners should always have a text label for people who cannot see them.",
    controls: [
      { type: "choice", key: "kind", label: "Style", default: "ring", options: [{ value: "ring", label: "Ring" }, { value: "dots", label: "Dots" }, { value: "bars", label: "Bars" }] },
      colorControl("orange"),
      sizeControl("md"),
      { type: "range", key: "speed", label: "Speed (seconds per cycle)", min: 0.4, max: 2, step: 0.1, default: 0.8, unit: "s" },
      { type: "toggle", key: "label", label: "Show label", default: true },
    ],
    render: (v) => <SpinnerDemo v={v} />,
  },
  avatar: {
    hint: "Type a name to change the initials. Try the group view.",
    controls: [
      { type: "text", key: "name", label: "Name", default: "Miguel Torres", maxLength: 24 },
      { type: "choice", key: "shape", label: "Shape", default: "circle", options: [{ value: "circle", label: "Circle" }, { value: "rounded", label: "Rounded" }, { value: "square", label: "Square" }] },
      { type: "choice", key: "size", label: "Size", default: "lg", options: [{ value: "sm", label: "Small" }, { value: "md", label: "Medium" }, { value: "lg", label: "Large" }, { value: "xl", label: "X-large" }] },
      colorControl("orange"),
      { type: "choice", key: "status", label: "Status", default: "online", options: [{ value: "none", label: "None" }, { value: "online", label: "Online" }, { value: "away", label: "Away" }, { value: "busy", label: "Busy" }] },
      { type: "toggle", key: "group", label: "Avatar group", default: false },
    ],
    render: (v) => <AvatarDemo v={v} />,
  },
  pagination: {
    hint: "Click a page or an arrow. Long lists collapse into … gaps.",
    controls: [
      { type: "range", key: "pages", label: "Total pages", min: 3, max: 50, step: 1, default: 12 },
      { type: "choice", key: "siblings", label: "Pages next to current", default: "1", options: [{ value: "1", label: "1" }, { value: "2", label: "2" }] },
      { type: "choice", key: "style", label: "Style", default: "outline", options: [{ value: "outline", label: "Outline" }, { value: "plain", label: "Plain" }] },
      radiusControl("soft"),
      { type: "toggle", key: "arrows", label: "Prev / next arrows", default: true },
    ],
    render: (v) => <PaginationDemo v={v} />,
  },
} satisfies Record<string, Sample>;
