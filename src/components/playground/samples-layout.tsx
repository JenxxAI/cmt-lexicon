import { useEffect, useId, useRef, useState } from "react";
import styles from "./Playground.module.css";
import { BOX_RADIUS, boxRadiusControl, colorControl, tone } from "./tones";
import { bool, num, str, type Sample, type Values } from "./types";

const closeIcon = (
  <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
);
const menuIcon = (open: boolean) => (
  <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg>
);
const stop = (event: { preventDefault: () => void }) => event.preventDefault();

/* ---------- Bento grid ---------- */

const BENTO = [["Analytics", "Track growth"], ["Team", "Invite people"], ["Billing", "Plans and invoices"], ["Security", "Keep it safe"], ["Support", "We reply fast"], ["Docs", "Learn the basics"]];

function BentoDemo({ v }: { v: Values }) {
  const [picked, setPicked] = useState<number | null>(0);
  const t = tone(str(v, "color"));
  const cols = num(v, "cols");
  return (
    <div className="grid w-full max-w-lg" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: num(v, "gap") }}>
      {BENTO.map(([title, sub], index) => (
        <button
          key={title}
          type="button"
          aria-pressed={picked === index}
          onClick={() => setPicked(picked === index ? null : index)}
          className={`flex min-h-24 flex-col justify-end p-3 text-left transition-transform hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${BOX_RADIUS[str(v, "radius")]} ${bool(v, "featured") && index === 0 ? "col-span-2 row-span-2" : ""} ${picked === index ? t.grad : "bg-surface"}`}
        >
          <span className="font-display text-base font-bold">{title}</span>
          <span className={`text-xs ${picked === index ? "" : "text-muted"}`}>{sub}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- Bottom sheet ---------- */

const SHEET_RADIUS: Record<string, string> = { sharp: "rounded-t-none", soft: "rounded-t-lg", round: "rounded-t-2xl", xl: "rounded-t-[28px]" };

function SheetDemo({ v }: { v: Values }) {
  const [open, setOpen] = useState(false);
  const [tall, setTall] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const first = useRef<HTMLButtonElement>(null);
  const title = useId();

  useEffect(() => {
    if (open) first.current?.focus();
  }, [open]);

  function close() {
    setOpen(false);
    setTall(false);
    trigger.current?.focus();
  }

  return (
    <div onKeyDown={(event) => open && event.key === "Escape" && close()} className="relative h-72 w-full max-w-xs overflow-hidden rounded-[28px] border border-rule bg-surface">
      <div className="p-5">
        <p className="font-display text-lg font-bold">Photo.jpg</p>
        <div aria-hidden="true" className={`mt-3 h-24 rounded-2xl ${tone(str(v, "color")).grad}`} />
        <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="mt-4 min-h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white hover:bg-body">Share</button>
      </div>
      {open && bool(v, "backdrop") && <div aria-hidden="true" onClick={close} className="absolute inset-0 bg-ink/40" />}
      <div
        role="dialog"
        aria-labelledby={title}
        hidden={!open}
        className={`${styles.rise} absolute inset-x-0 bottom-0 flex flex-col bg-surface p-4 shadow-[0_-8px_24px_rgba(17,17,17,0.18)] ${SHEET_RADIUS[str(v, "radius")]}`}
        style={{ height: `${tall ? 92 : num(v, "height")}%` }}
      >
        {bool(v, "handle") ? (
          <button type="button" aria-label={tall ? "Collapse sheet" : "Expand sheet"} onClick={() => setTall((x) => !x)} className="mx-auto -mt-2 grid min-h-11 w-16 place-items-center">
            <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-dim" />
          </button>
        ) : null}
        <h4 id={title} className="font-display text-lg font-bold">Share with</h4>
        <ul className="mt-1">
          {["Copy link", "Message", "Email"].map((label, index) => (
            <li key={label}><button ref={index === 0 ? first : undefined} type="button" onClick={close} className="min-h-11 w-full rounded-xl px-2 text-left text-sm hover:bg-line">{label}</button></li>
          ))}
        </ul>
        <button type="button" onClick={close} className="mt-auto min-h-11 rounded-full bg-line text-sm font-medium hover:bg-rule">Cancel</button>
      </div>
    </div>
  );
}

/* ---------- Card ---------- */

function CardDemo({ v }: { v: Values }) {
  const [saved, setSaved] = useState(false);
  const t = tone(str(v, "color"));
  const horizontal = str(v, "layout") === "horizontal";
  const shadow = { none: "", soft: "shadow-sm", lifted: "shadow-xl" }[str(v, "elevation")];
  return (
    <article className={`flex w-full max-w-sm overflow-hidden bg-surface ${horizontal ? "flex-row" : "flex-col"} ${BOX_RADIUS[str(v, "radius")]} ${shadow}`}>
      {bool(v, "media") && <div aria-hidden="true" className={`${horizontal ? "w-28 shrink-0" : "h-32"} ${t.grad}`} />}
      <div className="min-w-0 flex-1" style={{ padding: num(v, "padding") }}>
        <h4 className="font-display text-xl font-bold">Trail Runner</h4>
        <p className="mt-1 text-sm text-body">Light, grippy shoes for muddy weekend runs.</p>
        <div className="mt-3 flex items-center gap-2">
          {bool(v, "action") && <button type="button" className={`min-h-11 rounded-full px-5 text-sm font-semibold hover:opacity-85 ${t.solid}`}>View details</button>}
          <button type="button" aria-pressed={saved} aria-label="Save for later" onClick={() => setSaved((s) => !s)} className="grid size-11 place-items-center rounded-full hover:bg-line">
            <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-6 ${saved ? "text-red" : "text-body"}`} fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 20s-7-4.4-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.6-7 10-7 10z" /></svg>
          </button>
        </div>
      </div>
    </article>
  );
}

/* ---------- Carousel ---------- */

const PLACES = ["Mountains", "Beach", "Forest", "Desert", "City", "Lake"];

function CarouselDemo({ v }: { v: Values }) {
  const count = num(v, "slides");
  const perView = num(v, "perView");
  const pages = Math.max(1, count - perView + 1);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [reduced, setReduced] = useState(false);
  const t = tone(str(v, "color"));
  const loop = bool(v, "loop");
  const auto = bool(v, "autoplay") && !reduced;
  const current = Math.min(index, pages - 1);

  useEffect(() => setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches), []);
  useEffect(() => {
    if (!auto || paused || hover) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % pages), 3000);
    return () => window.clearInterval(timer);
  }, [auto, paused, hover, pages]);

  const go = (to: number) => setIndex(loop ? (to + pages) % pages : Math.max(0, Math.min(pages - 1, to)));
  const nav = "grid size-11 place-items-center rounded-full bg-surface shadow hover:bg-line disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div role="region" aria-roledescription="carousel" aria-label="Travel photos" className="w-full max-w-md" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)}>
      <div className="overflow-hidden rounded-2xl">
        <div aria-live={auto && !paused ? "off" : "polite"} className="flex transition-transform duration-300 motion-reduce:transition-none" style={{ transform: `translateX(-${current * (100 / perView)}%)` }}>
          {PLACES.slice(0, count).map((place, i) => {
            const visible = i >= current && i < current + perView;
            return (
              <div key={place} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${count}`} aria-hidden={!visible} className="shrink-0 px-1" style={{ flexBasis: `${100 / perView}%` }}>
                <div className={`grid h-40 place-items-center rounded-xl font-display text-2xl font-extrabold ${t.grad}`}>{place}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        {bool(v, "arrows") ? <button type="button" aria-label="Previous slide" onClick={() => go(current - 1)} disabled={!loop && current === 0} className={nav}>‹</button> : <span />}
        {bool(v, "dots") && (
          <div className="flex items-center">
            {Array.from({ length: pages }, (_, i) => (
              <button key={i} type="button" aria-label={`Go to slide ${i + 1}`} aria-current={i === current} onClick={() => setIndex(i)} className="grid size-11 place-items-center">
                <span aria-hidden="true" className={`block h-2.5 rounded-full transition-all motion-reduce:transition-none ${i === current ? "w-6 bg-ink" : "w-2.5 bg-dim"}`} />
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          {auto && <button type="button" onClick={() => setPaused((p) => !p)} className="min-h-11 rounded-full bg-surface px-4 text-sm font-medium shadow hover:bg-line">{paused ? "Play" : "Pause"}</button>}
          {bool(v, "arrows") && <button type="button" aria-label="Next slide" onClick={() => go(current + 1)} disabled={!loop && current === pages - 1} className={nav}>›</button>}
        </div>
      </div>
    </div>
  );
}

/* ---------- Hero section ---------- */

function HeroDemo({ v }: { v: Values }) {
  const [note, setNote] = useState("");
  const t = tone(str(v, "color"));
  const gradient = str(v, "background") === "gradient";
  const split = str(v, "layout") === "split";
  const surface = gradient ? t.grad : "bg-surface text-ink";
  const primary = gradient ? "bg-surface text-ink hover:opacity-90" : `${t.solid} hover:opacity-85`;
  return (
    <div className="w-full max-w-xl">
      <section aria-label="Hero preview" className={`flex flex-wrap items-center gap-6 p-6 sm:p-8 ${BOX_RADIUS[str(v, "radius")]} ${surface} ${split ? "" : "justify-center text-center"}`} style={{ minHeight: num(v, "height") }}>
        <div className={`min-w-0 ${split ? "flex-[1_1_16rem]" : "max-w-md"}`}>
          <h3 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{str(v, "headline") || "Your headline"}</h3>
          {bool(v, "sub") && <p className={`mt-3 text-base ${gradient ? "" : "text-body"}`}>One short sentence that says who it is for and why it helps.</p>}
          <div className={`mt-5 flex flex-wrap gap-2 ${split ? "" : "justify-center"}`}>
            <button type="button" onClick={() => setNote("Primary action clicked")} className={`min-h-12 rounded-full px-6 text-base font-semibold ${primary}`}>Get started</button>
            {num(v, "buttons") === 2 && <button type="button" onClick={() => setNote("Secondary action clicked")} className="min-h-12 rounded-full border-2 border-current px-6 text-base font-semibold hover:bg-black/10">Learn more</button>}
          </div>
        </div>
        {split && <div aria-hidden="true" className={`h-40 min-w-32 flex-[1_1_10rem] rounded-2xl ${gradient ? "bg-white/30" : t.grad}`} />}
      </section>
      <p aria-live="polite" className="mt-2 min-h-5 text-center text-sm text-muted">{note}</p>
    </div>
  );
}

/* ---------- Navbar ---------- */

const NAV_LINKS = ["Home", "Features", "Pricing", "Docs", "Blog"];

function NavbarDemo({ v }: { v: Values }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const menu = useId();
  const t = tone(str(v, "color"));
  const mobile = str(v, "view") === "mobile";
  const links = NAV_LINKS.slice(0, num(v, "links"));
  const current = Math.min(active, links.length - 1);
  const link = (i: number) => `inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium ${current === i ? t.soft : "hover:bg-line"}`;
  return (
    <nav aria-label="Main preview" className={`w-full ${mobile ? "max-w-[20rem]" : "max-w-2xl"} bg-surface px-4 py-1 ${str(v, "style") === "pill" ? "rounded-full shadow-lg" : "rounded-2xl"}`}>
      <div className="flex items-center justify-between gap-3">
        <a href="#" onClick={stop} className="inline-flex min-h-11 items-center font-display text-lg font-extrabold">Acme</a>
        {!mobile && (
          <ul className="flex items-center gap-1">
            {links.map((name, i) => (
              <li key={name}><a href="#" aria-current={current === i ? "page" : undefined} onClick={(e) => { stop(e); setActive(i); }} className={link(i)}>{name}</a></li>
            ))}
          </ul>
        )}
        <div className="flex items-center gap-1">
          {bool(v, "search") && <button type="button" aria-label="Search" className="grid size-11 place-items-center rounded-full hover:bg-line"><svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></svg></button>}
          {bool(v, "cta") && !mobile && <button type="button" className={`min-h-11 whitespace-nowrap rounded-full px-5 text-sm font-semibold hover:opacity-85 ${t.solid}`}>Sign up</button>}
          {mobile && <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} aria-controls={menu} onClick={() => setOpen((o) => !o)} className="grid size-11 place-items-center rounded-full hover:bg-line">{menuIcon(open)}</button>}
        </div>
      </div>
      {mobile && (
        <ul id={menu} hidden={!open} className="flex flex-col gap-1 pb-3">
          {links.map((name, i) => (
            <li key={name}><a href="#" aria-current={current === i ? "page" : undefined} onClick={(e) => { stop(e); setActive(i); setOpen(false); }} className={`${link(i)} w-full`}>{name}</a></li>
          ))}
          {bool(v, "cta") && <li><button type="button" className={`min-h-11 w-full rounded-full text-sm font-semibold ${t.solid}`}>Sign up</button></li>}
        </ul>
      )}
    </nav>
  );
}

/* ---------- Sidebar ---------- */

const SIDE: [string, string][] = [
  ["Dashboard", "M4 4h7v7H4zM13 4h7v4h-7zM13 11h7v9h-7zM4 14h7v6H4z"],
  ["Projects", "M3 7h6l2 2h10v10H3z"],
  ["Team", "M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 3-5 6-5s6 2 6 5M17 11a2.5 2.5 0 100-5M21 19c0-2-1.5-3.5-3-4"],
  ["Reports", "M5 20V10M12 20V4M19 20v-7"],
  ["Settings", "M12 15a3 3 0 100-6 3 3 0 000 6zM4 12h2M18 12h2M12 4v2M12 18v2"],
];

function SidebarDemo({ v }: { v: Values }) {
  const items = SIDE.slice(0, num(v, "items"));
  const [active, setActive] = useState(0);
  const [local, setLocal] = useState<boolean | null>(null);
  const ctl = bool(v, "collapsed");
  useEffect(() => setLocal(null), [ctl]);
  const collapsed = local ?? ctl;
  const t = tone(str(v, "color"));
  const current = Math.min(active, items.length - 1);
  return (
    <div className={`flex h-72 w-full max-w-lg overflow-hidden bg-surface ${BOX_RADIUS[str(v, "radius")]} ${str(v, "side") === "right" ? "flex-row-reverse" : ""}`}>
      <nav aria-label="Sidebar preview" className="flex shrink-0 flex-col gap-1 border-rule bg-paper p-2 transition-[width] duration-200 motion-reduce:transition-none" style={{ width: collapsed ? 64 : num(v, "width") }}>
        <button type="button" aria-expanded={!collapsed} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setLocal(!collapsed)} className="grid size-11 place-items-center rounded-xl hover:bg-line">{menuIcon(false)}</button>
        {items.map(([label, path], i) => (
          <button key={label} type="button" aria-label={collapsed ? label : undefined} title={collapsed ? label : undefined} aria-current={current === i ? "page" : undefined} onClick={() => setActive(i)} className={`flex min-h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium ${current === i ? t.solid : "hover:bg-line"}`}>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={path} /></svg>
            {!collapsed && <span className="truncate">{label}</span>}
          </button>
        ))}
      </nav>
      <div className="min-w-0 flex-1 p-4">
        <p className="font-display text-xl font-bold">{items[current][0]}</p>
        <div aria-hidden="true" className="mt-3 space-y-2"><div className="h-3 w-3/4 rounded-full bg-skel-soft" /><div className="h-3 w-1/2 rounded-full bg-skel-soft" /><div className="h-20 rounded-2xl bg-line" /></div>
      </div>
    </div>
  );
}

/* ---------- Sticky header ---------- */

function StickyDemo({ v }: { v: Values }) {
  const [scrolled, setScrolled] = useState(false);
  const t = tone(str(v, "color"));
  const look = str(v, "look");
  const height = num(v, "height");
  const shrink = bool(v, "shrink") && scrolled;
  const surface = look === "blur" ? "bg-surface/70 backdrop-blur-md" : look === "colored" ? t.grad : "bg-surface";
  return (
    <div tabIndex={0} role="region" aria-label="Scrollable page preview" onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 8)} className="h-64 w-full max-w-lg overflow-auto rounded-2xl bg-paper">
      <header className={`sticky top-0 z-10 flex items-center justify-between px-4 transition-[height,box-shadow] duration-200 motion-reduce:transition-none ${surface} ${bool(v, "shadow") && scrolled ? "shadow-md" : ""}`} style={{ height: shrink ? Math.max(44, height * 0.65) : height }}>
        <span className="font-display text-lg font-extrabold">Acme</span>
        <span className="flex gap-1 text-sm font-medium"><button type="button" className="min-h-11 rounded-full px-3 hover:bg-black/10">Docs</button><button type="button" className="min-h-11 rounded-full px-3 hover:bg-black/10">Pricing</button></span>
      </header>
      <div className="space-y-3 p-4 text-sm text-body">
        {Array.from({ length: 10 }, (_, i) => <p key={i}>Scroll this box. The header stays pinned at the top while the page content moves underneath it. Section {i + 1}.</p>)}
      </div>
    </div>
  );
}

/* ---------- Footer ---------- */

const GROUPS: [string, string[]][] = [["Product", ["Features", "Pricing", "Docs"]], ["Company", ["About", "Careers", "Blog"]], ["Legal", ["Privacy", "Terms"]], ["Support", ["Help", "Contact", "Status"]]];

function FooterDemo({ v }: { v: Values }) {
  const [done, setDone] = useState(false);
  const t = tone(str(v, "color"));
  const look = str(v, "look");
  const dark = look === "dark";
  const colored = look === "color";
  const surface = dark ? "bg-ink text-white" : colored ? t.grad : "bg-surface text-ink";
  const linkCls = dark ? "text-rule hover:text-white" : colored ? "hover:underline" : "text-body hover:text-ink";
  const id = useId();
  return (
    <footer className={`w-full max-w-xl p-6 ${BOX_RADIUS[str(v, "radius")]} ${surface}`}>
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${num(v, "cols")}, minmax(0, 1fr))` }}>
        {GROUPS.slice(0, num(v, "cols")).map(([title, links]) => (
          <div key={title}>
            <p className="font-display text-sm font-bold">{title}</p>
            <ul className="mt-1">{links.map((l) => <li key={l}><a href="#" onClick={stop} className={`inline-flex min-h-11 items-center text-sm ${linkCls}`}>{l}</a></li>)}</ul>
          </div>
        ))}
      </div>
      {bool(v, "newsletter") && (
        <form onSubmit={(e) => { stop(e); setDone(true); }} className="mt-4 flex flex-wrap items-center gap-2">
          <label htmlFor={id} className="sr-only">Email address</label>
          <input id={id} type="email" required placeholder="you@email.com" className="min-h-11 min-w-0 flex-[1_1_10rem] rounded-full border border-rule bg-surface px-4 text-sm text-ink" />
          <button type="submit" className={`min-h-11 rounded-full px-5 text-sm font-semibold ${dark ? "bg-surface text-ink" : "bg-ink text-white"}`}>Subscribe</button>
          <p aria-live="polite" className="w-full text-sm">{done ? "Thanks! Check your inbox." : ""}</p>
        </form>
      )}
      <div className={`mt-4 flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-xs ${dark ? "border-body text-rule" : colored ? "border-current/30" : "border-rule text-muted"}`}>
        <span>© 2026 Acme</span>
        {bool(v, "social") && <span className="flex gap-1">{["X", "in", "ig"].map((s, i) => <button key={s} type="button" aria-label={["Follow on X", "Follow on LinkedIn", "Follow on Instagram"][i]} className="grid size-11 place-items-center rounded-full text-sm font-bold hover:bg-black/10">{s}</button>)}</span>}
      </div>
    </footer>
  );
}

const choice = (key: string, label: string, def: string, options: [string, string][]) => ({ type: "choice" as const, key, label, default: def, options: options.map(([value, text]) => ({ value, label: text })) });

export const LAYOUT_SAMPLES = {
  "bento-grid": {
    hint: "Click a tile to select it. Try the featured tile.",
    controls: [choice("cols", "Columns", "3", [["2", "2"], ["3", "3"], ["4", "4"]]), { type: "range", key: "gap", label: "Gap", min: 4, max: 32, step: 4, default: 12, unit: "px" }, boxRadiusControl("xl"), colorControl("orange"), { type: "toggle", key: "featured", label: "Large first tile", default: true }],
    render: (v) => <BentoDemo v={v} />,
  },
  "bottom-sheet": {
    hint: "Tap Share, then drag-free: use the handle to expand. Esc closes.",
    controls: [{ type: "range", key: "height", label: "Height", min: 30, max: 80, step: 5, default: 55, unit: "%" }, boxRadiusControl("xl"), colorControl("orange"), { type: "toggle", key: "handle", label: "Drag handle", default: true }, { type: "toggle", key: "backdrop", label: "Dim background", default: true }],
    render: (v) => <SheetDemo v={v} />,
  },
  card: {
    hint: "Save it with the heart. Switch to a horizontal layout.",
    controls: [choice("layout", "Layout", "vertical", [["vertical", "Vertical"], ["horizontal", "Horizontal"]]), choice("elevation", "Shadow", "soft", [["none", "None"], ["soft", "Soft"], ["lifted", "Lifted"]]), boxRadiusControl("xl"), colorControl("orange"), { type: "range", key: "padding", label: "Padding", min: 12, max: 32, step: 4, default: 20, unit: "px" }, { type: "toggle", key: "media", label: "Image", default: true }, { type: "toggle", key: "action", label: "Button", default: true }],
    render: (v) => <CardDemo v={v} />,
  },
  carousel: {
    hint: "Use arrows, dots, or Pause. Autoplay pauses on hover, focus, and reduced motion.",
    controls: [{ type: "range", key: "slides", label: "Slides", min: 2, max: 6, step: 1, default: 4 }, choice("perView", "Visible at once", "1", [["1", "1"], ["2", "2"]]), colorControl("blue"), { type: "toggle", key: "arrows", label: "Arrows", default: true }, { type: "toggle", key: "dots", label: "Dots", default: true }, { type: "toggle", key: "loop", label: "Loop", default: true }, { type: "toggle", key: "autoplay", label: "Autoplay", default: false }],
    render: (v) => <CarouselDemo v={v} />,
  },
  "hero-section": {
    hint: "Edit the headline and try the split layout.",
    controls: [{ type: "text", key: "headline", label: "Headline", default: "Build faster, ship calmer", maxLength: 40 }, choice("layout", "Layout", "centered", [["centered", "Centered"], ["split", "Split"]]), choice("background", "Background", "gradient", [["plain", "Plain"], ["gradient", "Gradient"]]), colorControl("orange"), boxRadiusControl("xl"), { type: "range", key: "height", label: "Minimum height", min: 200, max: 420, step: 20, default: 260, unit: "px" }, choice("buttons", "Buttons", "2", [["1", "One"], ["2", "Two"]]), { type: "toggle", key: "sub", label: "Subheading", default: true }],
    render: (v) => <HeroDemo v={v} />,
  },
  navbar: {
    hint: "Switch to Mobile to see the menu collapse behind a button.",
    controls: [choice("view", "Screen", "desktop", [["desktop", "Desktop"], ["mobile", "Mobile"]]), choice("style", "Style", "plain", [["plain", "Plain"], ["pill", "Floating pill"]]), colorControl("orange"), { type: "range", key: "links", label: "Links", min: 2, max: 5, step: 1, default: 4 }, { type: "toggle", key: "cta", label: "Sign-up button", default: true }, { type: "toggle", key: "search", label: "Search icon", default: false }],
    render: (v) => <NavbarDemo v={v} />,
  },
  sidebar: {
    hint: "Collapse it with the top button. Collapsed items keep their names for screen readers.",
    controls: [choice("side", "Side", "left", [["left", "Left"], ["right", "Right"]]), colorControl("ink"), boxRadiusControl("round"), { type: "range", key: "width", label: "Width", min: 180, max: 280, step: 20, default: 200, unit: "px" }, { type: "range", key: "items", label: "Items", min: 3, max: 5, step: 1, default: 4 }, { type: "toggle", key: "collapsed", label: "Collapsed", default: false }],
    render: (v) => <SidebarDemo v={v} />,
  },
  "sticky-header": {
    hint: "Scroll inside the box, not the page.",
    controls: [choice("look", "Look", "solid", [["solid", "Solid"], ["blur", "Blurred glass"], ["colored", "Colored"]]), colorControl("orange"), { type: "range", key: "height", label: "Height", min: 48, max: 96, step: 8, default: 64, unit: "px" }, { type: "toggle", key: "shrink", label: "Shrink on scroll", default: true }, { type: "toggle", key: "shadow", label: "Shadow on scroll", default: true }],
    render: (v) => <StickyDemo v={v} />,
  },
  footer: {
    hint: "Try the newsletter form and the dark look.",
    controls: [choice("look", "Look", "light", [["light", "Light"], ["dark", "Dark"], ["color", "Color"]]), colorControl("orange"), boxRadiusControl("xl"), { type: "range", key: "cols", label: "Link columns", min: 2, max: 4, step: 1, default: 3 }, { type: "toggle", key: "newsletter", label: "Newsletter", default: true }, { type: "toggle", key: "social", label: "Social icons", default: true }],
    render: (v) => <FooterDemo v={v} />,
  },
} satisfies Record<string, Sample>;
