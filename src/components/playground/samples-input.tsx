import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import styles from "./Playground.module.css";
import { BOX_RADIUS, RADIUS, boxRadiusControl, colorControl, radiusControl, sizeControl, tone } from "./tones";
import { bool, num, str, type Sample, type Values } from "./types";

const choice = (key: string, label: string, def: string, options: [string, string][]) => ({ type: "choice" as const, key, label, default: def, options: options.map(([value, text]) => ({ value, label: text })) });
const chevron = <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6l5 5 5-5" /></svg>;

/* ---------- Dropdown + kebab menu (shared) ---------- */

const MENU_ITEMS = ["Edit", "Duplicate", "Share", "Archive"];
const GLYPH: Record<string, string> = { Edit: "M4 20h4L19 9l-4-4L4 16zM13 7l4 4", Duplicate: "M8 8h11v11H8zM5 16V5h11", Share: "M12 4v11M8 8l4-4 4 4M5 14v6h14v-6", Archive: "M4 6h16v4H4zM6 10v10h12V10M10 14h4", Delete: "M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13" };

function MenuDemo({ v, kebab }: { v: Values; kebab: boolean }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const triggerId = useId();
  const menuId = useId();
  const t = tone(str(v, "color"));
  const list = [...MENU_ITEMS.slice(0, num(v, "items")), ...(bool(v, "danger") ? ["Delete"] : [])];

  function openAt(where: "first" | "last") {
    setOpen(true);
    window.requestAnimationFrame(() => refs.current[where === "first" ? 0 : list.length - 1]?.focus());
  }
  function close(refocus: boolean) {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  }
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!box.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  function onTriggerKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") { event.preventDefault(); openAt("first"); }
    if (event.key === "ArrowUp") { event.preventDefault(); openAt("last"); }
  }
  function onMenuKey(event: KeyboardEvent) {
    const at = refs.current.findIndex((el) => el === document.activeElement);
    const go = (i: number) => { event.preventDefault(); refs.current[(i + list.length) % list.length]?.focus(); };
    if (event.key === "ArrowDown") go(at + 1);
    else if (event.key === "ArrowUp") go(at - 1);
    else if (event.key === "Home") go(0);
    else if (event.key === "End") go(list.length - 1);
    else if (event.key === "Escape") { event.preventDefault(); close(true); }
    else if (event.key === "Tab") close(false);
  }

  const size = { sm: "size-11", md: "size-12", lg: "size-14" }[str(v, "size") || "md"];
  const dots = str(v, "orientation") === "horizontal"
    ? <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
    : <svg aria-hidden="true" viewBox="0 0 24 24" className="size-6" fill="currentColor"><circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" /></svg>;
  const end = str(v, "align") === "end";

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-3">
      <div ref={box} className={kebab ? "flex w-full items-center justify-between rounded-2xl bg-surface p-2 pl-4" : "relative"}>
        {kebab && <span className="font-semibold">Project Alpha</span>}
        <div className="relative">
          <button
            ref={trigger}
            id={triggerId}
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            aria-controls={open ? menuId : undefined}
            aria-label={kebab ? "Project actions" : undefined}
            onClick={() => (open ? close(false) : openAt("first"))}
            onKeyDown={onTriggerKey}
            className={kebab ? `grid ${size} place-items-center rounded-full hover:bg-line` : "inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-body"}
          >
            {kebab ? dots : <>Options {chevron}</>}
          </button>
          <div
            id={menuId}
            role="menu"
            aria-labelledby={triggerId}
            hidden={!open}
            onKeyDown={onMenuKey}
            className={`${styles.fade} absolute top-full z-20 mt-2 max-w-[70vw] bg-surface p-1.5 shadow-xl ring-1 ring-black/5 ${end ? "right-0" : "left-0"} ${BOX_RADIUS[str(v, "radius")]}`}
            style={{ width: num(v, "width") }}
          >
            {list.map((name, i) => (
              <div key={name}>
                {name === "Delete" && <div role="separator" className="my-1 h-px bg-line" />}
                <button
                  ref={(el) => { refs.current[i] = el; }}
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={() => { setPicked(name); close(true); }}
                  className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium focus-visible:outline-offset-[-2px] ${name === "Delete" ? "text-red hover:bg-red-soft" : "hover:bg-line"} ${t.soft.includes("var") ? "focus:bg-[color:var(--cx-soft)]" : ""}`}
                >
                  {bool(v, "icons") && <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={GLYPH[name]} /></svg>}
                  {name}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-muted">{picked ? `You chose ${picked}` : "Open the menu, then use the arrow keys"}</p>
    </div>
  );
}

/* ---------- Command palette ---------- */

const CMDS = [["Actions", "New file", "N"], ["Actions", "Open settings", ","], ["Actions", "Copy link", "L"], ["Navigate", "Go to dashboard", "D"], ["Navigate", "Go to projects", "P"], ["Navigate", "Sign out", "Q"]];

function PaletteDemo({ v }: { v: Values }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);
  const [ran, setRan] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const t = tone(str(v, "color"));
  const found = CMDS.filter(([, name]) => name.toLowerCase().includes(query.trim().toLowerCase()));
  const active = Math.min(index, Math.max(0, found.length - 1));

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) { el.showModal(); input.current?.focus(); }
    if (!open && el.open) el.close();
  }, [open]);
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function run(i: number) {
    const hit = found[i];
    if (!hit) return;
    setRan(hit[1]);
    setOpen(false);
  }
  function onKey(event: KeyboardEvent) {
    if (event.key === "ArrowDown") { event.preventDefault(); setIndex((active + 1) % Math.max(1, found.length)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setIndex((active - 1 + found.length) % Math.max(1, found.length)); }
    else if (event.key === "Enter") { event.preventDefault(); run(active); }
  }

  const option = (cmd: string[], i: number) => (
    <li key={cmd[1]} id={`${listId}-${i}`} role="option" aria-selected={i === active} onMouseMove={() => setIndex(i)} onClick={() => run(i)} className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-xl px-3 text-sm font-medium ${i === active ? t.soft : ""}`}>
      {cmd[1]}
      {bool(v, "shortcuts") && <kbd className="rounded-md bg-line px-2 py-0.5 font-mono text-xs text-body">⌘{cmd[2]}</kbd>}
    </li>
  );
  const groups = bool(v, "grouped") ? ["Actions", "Navigate"] : [""];

  return (
    <>
      <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className="inline-flex min-h-12 items-center gap-3 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-body">
        Open command palette <kbd className="rounded-md bg-white/20 px-2 py-0.5 font-mono text-xs">⌘K</kbd>
      </button>
      <p aria-live="polite" className="text-sm text-muted">{ran ? `Ran: ${ran}` : "Press ⌘K or Ctrl+K too"}</p>
      <dialog
        ref={dialog}
        aria-label="Command palette"
        onClose={() => { setOpen(false); setQuery(""); setIndex(0); trigger.current?.focus(); }}
        onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        className={`${styles.backdrop} ${styles.pop} mx-auto mt-24 w-[min(32rem,calc(100%-2rem))] overflow-hidden bg-surface p-0 text-ink shadow-2xl ${BOX_RADIUS[str(v, "radius")]}`}
        style={{ ["--dim" as string]: num(v, "dim") }}
      >
        <div className="border-b border-rule p-3">
          <input
            ref={input}
            role="combobox"
            aria-label="Search commands"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={found.length ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setIndex(0); }}
            onKeyDown={onKey}
            placeholder="Type a command…"
            className="min-h-11 w-full bg-transparent px-2 text-base outline-none"
          />
        </div>
        <ul id={listId} role="listbox" aria-label="Commands" className="max-h-64 overflow-auto p-2">
          {found.length === 0 && <li role="presentation" className="px-3 py-6 text-center text-sm text-muted">No matching commands</li>}
          {groups.map((g) => {
            const items = found.map((cmd, i) => [cmd, i] as const).filter(([cmd]) => !g || cmd[0] === g);
            if (!items.length) return null;
            return g ? (
              <li key={g} role="presentation"><ul role="group" aria-label={g}><li role="presentation" className="px-3 pb-1 pt-2 font-mono text-xs uppercase text-muted">{g}</li>{items.map(([cmd, i]) => option(cmd, i))}</ul></li>
            ) : items.map(([cmd, i]) => option(cmd, i));
          })}
        </ul>
        <p className="border-t border-rule px-4 py-2 text-xs text-muted">↑↓ to move · Enter to run · Esc to close</p>
      </dialog>
    </>
  );
}

/* ---------- Hamburger icon ---------- */

function HamburgerDemo({ v }: { v: Values }) {
  const [open, setOpen] = useState(false);
  const menu = useId();
  const t = tone(str(v, "color"));
  const w = { sm: 20, md: 26, lg: 34 }[str(v, "size") || "md"] ?? 26;
  const th = num(v, "thickness");
  const gap = w * 0.3;
  const spin = str(v, "motion") === "spin";
  const shape = str(v, "shape");
  const line = (offset: number, transform: string, extra = "") => (
    <span aria-hidden="true" className={`absolute left-0 block w-full rounded-full bg-current transition-all duration-200 motion-reduce:transition-none ${extra}`} style={{ height: th, top: `calc(50% - ${th / 2}px)`, transform: open ? transform : `translateY(${offset}px)` }} />
  );
  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menu}
        aria-label={bool(v, "label") ? undefined : open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex min-h-14 min-w-14 items-center justify-center gap-3 px-3 font-semibold ${t.text} ${shape === "circle" ? "rounded-full bg-surface shadow" : shape === "rounded" ? "rounded-2xl bg-surface shadow" : "rounded-xl hover:bg-line"}`}
      >
        <span aria-hidden="true" className="relative block transition-transform duration-200 motion-reduce:transition-none" style={{ width: w, height: w, transform: spin && open ? "rotate(180deg)" : undefined }}>
          {line(-gap, `translateY(0) rotate(45deg)`)}
          <span aria-hidden="true" className={`absolute left-0 block w-full rounded-full bg-current transition-opacity duration-150 motion-reduce:transition-none ${open ? "opacity-0" : ""}`} style={{ height: th, top: `calc(50% - ${th / 2}px)` }} />
          {line(gap, `translateY(0) rotate(-45deg)`)}
        </span>
        {bool(v, "label") && <span className="text-ink">Menu</span>}
      </button>
      <ul id={menu} hidden={!open} className="w-44 rounded-2xl bg-surface p-1.5 shadow-lg">
        {["Home", "About", "Contact"].map((n) => <li key={n}><a href="#" onClick={(e) => e.preventDefault()} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium hover:bg-line">{n}</a></li>)}
      </ul>
    </div>
  );
}

/* ---------- Text input ---------- */

const PLACEHOLDER: Record<string, string> = { text: "Your name", email: "you@email.com", password: "At least 8 characters", search: "Search components", number: "0" };

function InputDemo({ v }: { v: Values }) {
  const [value, setValue] = useState("");
  const [reveal, setReveal] = useState(false);
  const id = useId();
  const help = `${id}-help`;
  const t = tone(str(v, "color"));
  const type = str(v, "type");
  const state = str(v, "state");
  const disabled = state === "disabled";
  const message = state === "error" ? (type === "email" ? "Enter a valid email address." : "This field is required.") : state === "success" ? "Looks good!" : "We will never share this.";
  const border = state === "error" ? "border-red" : state === "success" ? "border-green" : "border-dim";
  const h = { sm: "min-h-11 text-sm", md: "min-h-12 text-base", lg: "min-h-14 text-lg" }[str(v, "size")];
  return (
    <div className="w-full max-w-sm" style={{ ["--ring" as string]: t.css }}>
      {bool(v, "label") && <label htmlFor={id} className="mb-1.5 block text-sm font-semibold">{str(v, "labelText") || "Label"}</label>}
      <div className={`flex items-center gap-2 border-2 bg-surface px-3 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[color:var(--ring)] ${border} ${RADIUS[str(v, "radius")]} ${disabled ? "opacity-50" : ""}`}>
        {bool(v, "icon") && <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0 text-muted" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6" /><path d="M20 20l-4-4" /></svg>}
        <input
          id={id}
          type={type === "password" && reveal ? "text" : type}
          inputMode={type === "number" ? "numeric" : undefined}
          value={value}
          disabled={disabled}
          aria-invalid={state === "error" || undefined}
          aria-describedby={bool(v, "helper") ? help : undefined}
          placeholder={PLACEHOLDER[type]}
          onChange={(event) => setValue(event.target.value)}
          className={`min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted ${h}`}
        />
        {bool(v, "clear") && value && !disabled && (
          <button type="button" aria-label="Clear input" onClick={() => setValue("")} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-line"><svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg></button>
        )}
        {type === "password" && !disabled && (
          <button type="button" aria-pressed={reveal} onClick={() => setReveal((r) => !r)} className="min-h-11 shrink-0 rounded-full px-3 text-sm font-semibold hover:bg-line">{reveal ? "Hide" : "Show"}</button>
        )}
      </div>
      {bool(v, "helper") && <p id={help} className={`mt-1.5 text-sm ${state === "error" ? "font-medium text-red" : state === "success" ? "font-medium text-green" : "text-muted"}`}>{message}</p>}
    </div>
  );
}

/* ---------- Select ---------- */

const FRUITS = ["Mango", "Banana", "Calamansi", "Pineapple", "Papaya", "Lanzones"];

function SelectDemo({ v }: { v: Values }) {
  const id = useId();
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const t = tone(str(v, "color"));
  const options = FRUITS.slice(0, num(v, "options"));
  const state = str(v, "state");
  const disabled = state === "disabled";
  const h = { sm: "min-h-11 text-sm", md: "min-h-12 text-base", lg: "min-h-14 text-lg" }[str(v, "size")];
  const wrap = `flex w-full items-center justify-between gap-2 border-2 bg-surface px-4 text-left ${h} ${RADIUS[str(v, "radius")]} ${state === "error" ? "border-red" : "border-dim"} disabled:cursor-not-allowed disabled:opacity-50`;
  const custom = str(v, "mode") === "custom";

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  function onKey(event: KeyboardEvent) {
    const last = options.length - 1;
    if (!open && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) { event.preventDefault(); setOpen(true); setActive(Math.max(0, options.indexOf(value))); return; }
    if (event.key === "ArrowDown") { event.preventDefault(); setActive(Math.min(last, active + 1)); }
    else if (event.key === "ArrowUp") { event.preventDefault(); setActive(Math.max(0, active - 1)); }
    else if (event.key === "Home") { event.preventDefault(); setActive(0); }
    else if (event.key === "End") { event.preventDefault(); setActive(last); }
    else if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setValue(options[active]); setOpen(false); }
    else if (event.key === "Escape") setOpen(false);
    else if (event.key === "Tab") setOpen(false);
  }

  return (
    <div className="w-full max-w-sm" ref={box}>
      {bool(v, "label") && <label id={`${id}-label`} htmlFor={custom ? undefined : id} className="mb-1.5 block text-sm font-semibold" onClick={() => custom && document.getElementById(id)?.focus()}>Favorite fruit</label>}
      {!custom ? (
        <div className="relative">
          <select id={id} aria-label={bool(v, "label") ? undefined : "Favorite fruit"} value={value} disabled={disabled} aria-invalid={state === "error" || undefined} onChange={(event) => setValue(event.target.value)} className={`${wrap} appearance-none pr-10`}>
            <option value="">{str(v, "placeholder") || "Choose…"}</option>
            {options.map((o) => <option key={o}>{o}</option>)}
          </select>
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">{chevron}</span>
        </div>
      ) : (
        <div className="relative">
          <button
            id={id}
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={`${id}-list`}
            aria-labelledby={bool(v, "label") ? `${id}-label ${id}` : undefined}
            aria-label={bool(v, "label") ? undefined : "Favorite fruit"}
            aria-activedescendant={open ? `${id}-o${active}` : undefined}
            aria-invalid={state === "error" || undefined}
            disabled={disabled}
            onClick={() => { setOpen((o) => !o); setActive(Math.max(0, options.indexOf(value))); }}
            onKeyDown={onKey}
            className={wrap}
          >
            <span className={value ? "" : "text-muted"}>{value || str(v, "placeholder") || "Choose…"}</span>
            {chevron}
          </button>
          <ul id={`${id}-list`} role="listbox" aria-label="Fruit" hidden={!open} className={`${styles.fade} absolute z-20 mt-2 w-full bg-surface p-1.5 shadow-xl ring-1 ring-black/5 ${BOX_RADIUS.round}`}>
            {options.map((o, i) => (
              <li key={o} id={`${id}-o${i}`} role="option" aria-selected={o === value} onMouseMove={() => setActive(i)} onClick={() => { setValue(o); setOpen(false); document.getElementById(id)?.focus(); }} className={`flex min-h-11 cursor-pointer items-center justify-between rounded-xl px-3 text-sm font-medium ${i === active ? t.soft : ""}`}>
                {o}{o === value && <span aria-hidden="true">✓</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {state === "error" && <p className="mt-1.5 text-sm font-medium text-red">Please choose one.</p>}
    </div>
  );
}

/* ---------- File upload ---------- */

const MB = 1024 * 1024;
const sizeText = (b: number) => (b >= MB ? `${(b / MB).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);

function UploadDemo({ v }: { v: Values }) {
  const id = useId();
  const [files, setFiles] = useState<File[]>([]);
  const [msg, setMsg] = useState("");
  const [over, setOver] = useState(false);
  const t = tone(str(v, "color"));
  const multiple = bool(v, "multiple");
  const max = num(v, "max");

  function add(list: FileList | null) {
    if (!list || list.length === 0) return;
    const incoming = Array.from(multiple ? list : [list[0]]);
    const ok = incoming.filter((f) => f.size <= max * MB);
    const rejected = incoming.filter((f) => f.size > max * MB);
    setFiles((cur) => (multiple ? [...cur, ...ok] : ok));
    setMsg(rejected.length ? `${rejected[0].name} is larger than ${max} MB and was skipped.` : `${ok.length} ${ok.length === 1 ? "file" : "files"} added.`);
  }
  const zone = str(v, "style") === "dropzone";
  return (
    <div className="w-full max-w-sm">
      <div className="relative">
        <input id={id} type="file" multiple={multiple} onChange={(event) => { add(event.target.files); event.target.value = ""; }} className="peer sr-only" />
        <label
          htmlFor={id}
          onDragOver={(event) => { event.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(event) => { event.preventDefault(); setOver(false); add(event.dataTransfer.files); }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1 text-center peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-deep ${zone ? `min-h-40 border-2 border-dashed p-5 ${BOX_RADIUS[str(v, "radius")]} ${over ? `${t.soft} border-current` : "border-dim bg-surface"}` : `min-h-12 w-fit rounded-full px-6 ${t.solid}`}`}
        >
          {zone ? (<><svg aria-hidden="true" viewBox="0 0 24 24" className="size-8 text-muted" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V5M7 10l5-5 5 5M5 19h14" /></svg><span className="font-semibold">Drop {multiple ? "files" : "a file"} here</span><span className="text-sm text-muted">or click to browse · up to {max} MB</span></>) : <span className="font-semibold">Choose {multiple ? "files" : "a file"}</span>}
        </label>
      </div>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-muted">{msg}</p>
      {files.length > 0 && (
        <ul className="mt-1 space-y-1.5">
          {files.map((f, i) => (
            <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2 rounded-2xl bg-surface py-1 pl-4 pr-1 text-sm">
              <span className="min-w-0 truncate font-medium">{f.name} <span className="font-normal text-muted">{sizeText(f.size)}</span></span>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-line"><svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg></button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-2 text-xs text-muted">Files stay in your browser. Nothing is uploaded.</p>
    </div>
  );
}

/* ---------- Date picker ---------- */

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const stamp = (y: number, m: number, d: number) => new Date(y, m, d).getTime();
const label = (ms: number) => { const d = new Date(ms); return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`; };

function DateDemo({ v }: { v: Values }) {
  const [view, setView] = useState({ y: 2026, m: 9 });
  const [today, setToday] = useState<number | null>(null);
  const [sel, setSel] = useState<{ a: number | null; b: number | null }>({ a: null, b: null });
  const [focus, setFocus] = useState(1);
  const cells = useRef<Record<number, HTMLButtonElement | null>>({});
  const wantFocus = useRef(false);
  const t = tone(str(v, "color"));
  const monday = str(v, "start") === "monday";
  const range = str(v, "mode") === "range";
  const shape = { circle: "rounded-full", rounded: "rounded-xl", square: "rounded-none" }[str(v, "shape")];

  useEffect(() => {
    const now = new Date();
    setToday(stamp(now.getFullYear(), now.getMonth(), now.getDate()));
    setView({ y: now.getFullYear(), m: now.getMonth() });
    setFocus(now.getDate());
  }, []);
  useEffect(() => {
    if (wantFocus.current) { cells.current[focus]?.focus(); wantFocus.current = false; }
  }, [view, focus]);

  const dim = new Date(view.y, view.m + 1, 0).getDate();
  const lead = (new Date(view.y, view.m, 1).getDay() - (monday ? 1 : 0) + 7) % 7;
  const head = monday ? [...DAYS.slice(1), DAYS[0]] : DAYS;
  const weeks: (number | null)[][] = [];
  const flat = [...Array(lead).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
  while (flat.length % 7) flat.push(null);
  for (let i = 0; i < flat.length; i += 7) weeks.push(flat.slice(i, i + 7));
  const f = Math.min(focus, dim);

  function shift(months: number, day = f) {
    const d = new Date(view.y, view.m + months, 1);
    const days = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    setView({ y: d.getFullYear(), m: d.getMonth() });
    setFocus(Math.min(day, days));
  }
  function move(delta: number) {
    wantFocus.current = true;
    const next = f + delta;
    if (next < 1) { const prevDays = new Date(view.y, view.m, 0).getDate(); shift(-1, prevDays + next); }
    else if (next > dim) shift(1, next - dim);
    else setFocus(next);
  }
  function onKey(event: KeyboardEvent) {
    const map: Record<string, () => void> = { ArrowLeft: () => move(-1), ArrowRight: () => move(1), ArrowUp: () => move(-7), ArrowDown: () => move(7), PageUp: () => { wantFocus.current = true; shift(-1); }, PageDown: () => { wantFocus.current = true; shift(1); } };
    if (map[event.key]) { event.preventDefault(); map[event.key](); }
  }
  function pick(d: number) {
    const ms = stamp(view.y, view.m, d);
    setFocus(d);
    if (!range) return setSel({ a: ms, b: null });
    if (sel.a === null || sel.b !== null) return setSel({ a: ms, b: null });
    setSel(ms < sel.a ? { a: ms, b: sel.a } : { a: sel.a, b: ms });
  }

  const summary = sel.a === null ? "Pick a date" : sel.b === null ? (range ? `Start: ${label(sel.a)}. Pick an end date.` : `Selected: ${label(sel.a)}`) : `${label(sel.a)} to ${label(sel.b)}`;
  const nav = "grid size-11 place-items-center rounded-full hover:bg-line";

  return (
    <div className="w-full max-w-xs rounded-[28px] bg-surface p-4">
      <div className="flex items-center justify-between">
        <button type="button" aria-label="Previous month" onClick={() => shift(-1)} className={nav}>‹</button>
        <h4 aria-live="polite" className="font-display text-base font-bold">{MONTHS[view.m]} {view.y}</h4>
        <button type="button" aria-label="Next month" onClick={() => shift(1)} className={nav}>›</button>
      </div>
      <table role="grid" aria-label={`${MONTHS[view.m]} ${view.y}`} className="mt-2 w-full text-center text-sm" onKeyDown={onKey}>
        <thead><tr>{head.map((d) => <th key={d} scope="col" abbr={d} className="py-1 font-mono text-xs font-normal text-muted">{d.slice(0, 2)}</th>)}</tr></thead>
        <tbody>
          {weeks.map((w, wi) => (
            <tr key={wi}>
              {w.map((d, di) => {
                if (d === null) return <td key={di} />;
                const ms = stamp(view.y, view.m, d);
                const weekend = [0, 6].includes(new Date(ms).getDay());
                const off = bool(v, "noWeekends") && weekend;
                const edge = ms === sel.a || ms === sel.b;
                const mid = sel.a !== null && sel.b !== null && ms > sel.a && ms < sel.b;
                return (
                  <td key={di} className="p-0">
                    <button
                      ref={(el) => { cells.current[d] = el; }}
                      type="button"
                      tabIndex={d === f ? 0 : -1}
                      disabled={off}
                      aria-label={`${DAYS[new Date(ms).getDay()]}, ${MONTHS[view.m]} ${d}, ${view.y}`}
                      aria-pressed={edge || mid}
                      aria-current={ms === today ? "date" : undefined}
                      onClick={() => pick(d)}
                      className={`mx-auto grid size-11 place-items-center font-medium disabled:cursor-not-allowed disabled:opacity-30 ${shape} ${edge ? t.solid : mid ? t.soft : "hover:bg-line"} ${ms === today && !edge ? "ring-2 ring-inset ring-ink" : ""}`}
                    >{d}</button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p aria-live="polite" className="mt-2 text-center text-sm text-muted">{summary}</p>
    </div>
  );
}

const hamburgerControls = [choice("motion", "Animation", "cross", [["cross", "Cross"], ["spin", "Spin to cross"]]), choice("shape", "Button", "circle", [["plain", "Plain"], ["circle", "Circle"], ["rounded", "Rounded"]]), sizeControl("md"), colorControl("ink"), { type: "range" as const, key: "thickness", label: "Line thickness", min: 2, max: 6, step: 1, default: 3, unit: "px" }, { type: "toggle" as const, key: "label", label: "Show “Menu” text", default: false }];

export const INPUT_SAMPLES = {
  "dropdown-menu": {
    hint: "Open it, then use ↑ ↓ Home End. Esc closes and returns focus.",
    controls: [choice("align", "Align menu to", "start", [["start", "Left edge"], ["end", "Right edge"]]), colorControl("ink"), boxRadiusControl("round"), { type: "range", key: "width", label: "Menu width", min: 160, max: 260, step: 20, default: 200, unit: "px" }, { type: "range", key: "items", label: "Items", min: 2, max: 4, step: 1, default: 4 }, { type: "toggle", key: "icons", label: "Icons", default: true }, { type: "toggle", key: "danger", label: "Delete item", default: true }],
    render: (v) => <MenuDemo v={v} kebab={false} />,
  },
  "kebab-menu": {
    hint: "The three dots open row actions. Same keyboard rules as a dropdown.",
    controls: [choice("orientation", "Dots", "vertical", [["vertical", "Vertical ⋮"], ["horizontal", "Horizontal ⋯"]]), sizeControl("md"), choice("align", "Align menu to", "end", [["start", "Left edge"], ["end", "Right edge"]]), colorControl("ink"), boxRadiusControl("round"), { type: "range", key: "width", label: "Menu width", min: 160, max: 260, step: 20, default: 190, unit: "px" }, { type: "range", key: "items", label: "Items", min: 2, max: 4, step: 1, default: 3 }, { type: "toggle", key: "icons", label: "Icons", default: true }, { type: "toggle", key: "danger", label: "Delete item", default: true }],
    render: (v) => <MenuDemo v={v} kebab />,
  },
  "command-palette": {
    hint: "Open it, type to filter, ↑ ↓ to move, Enter to run.",
    controls: [colorControl("ink"), boxRadiusControl("xl"), { type: "range", key: "dim", label: "Background dim", min: 0, max: 80, step: 10, default: 40, unit: "%" }, { type: "toggle", key: "grouped", label: "Group results", default: true }, { type: "toggle", key: "shortcuts", label: "Show shortcuts", default: true }],
    render: (v) => <PaletteDemo v={v} />,
  },
  "hamburger-icon": {
    hint: "Click to morph into a cross. The label is announced as open or closed.",
    controls: hamburgerControls,
    render: (v) => <HamburgerDemo v={v} />,
  },
  "text-input": {
    hint: "Type, switch the field type, and try the error and success states.",
    controls: [choice("type", "Type", "text", [["text", "Text"], ["email", "Email"], ["password", "Password"], ["search", "Search"], ["number", "Number"]]), choice("state", "State", "default", [["default", "Default"], ["error", "Error"], ["success", "Success"], ["disabled", "Disabled"]]), sizeControl("md"), colorControl("ink"), radiusControl("soft"), { type: "text", key: "labelText", label: "Label text", default: "Full name", maxLength: 24 }, { type: "toggle", key: "label", label: "Label", default: true }, { type: "toggle", key: "helper", label: "Helper text", default: true }, { type: "toggle", key: "icon", label: "Left icon", default: false }, { type: "toggle", key: "clear", label: "Clear button", default: true }],
    render: (v) => <InputDemo v={v} />,
  },
  select: {
    hint: "Native is simplest. Custom lets you style the list, so it needs more keyboard code.",
    controls: [choice("mode", "Kind", "native", [["native", "Native"], ["custom", "Custom list"]]), choice("state", "State", "default", [["default", "Default"], ["error", "Error"], ["disabled", "Disabled"]]), sizeControl("md"), colorControl("ink"), radiusControl("soft"), { type: "text", key: "placeholder", label: "Placeholder", default: "Choose a fruit", maxLength: 24 }, { type: "range", key: "options", label: "Options", min: 3, max: 6, step: 1, default: 5 }, { type: "toggle", key: "label", label: "Label", default: true }],
    render: (v) => <SelectDemo v={v} />,
  },
  "file-upload": {
    hint: "Choose or drag files here. Files bigger than the limit are skipped.",
    controls: [choice("style", "Style", "dropzone", [["dropzone", "Drop zone"], ["button", "Button"]]), colorControl("orange"), boxRadiusControl("xl"), { type: "range", key: "max", label: "Size limit", min: 1, max: 25, step: 1, default: 5, unit: " MB" }, { type: "toggle", key: "multiple", label: "Multiple files", default: true }],
    render: (v) => <UploadDemo v={v} />,
  },
  "date-picker": {
    hint: "Arrow keys move by day and week. PageUp and PageDown change month.",
    controls: [choice("mode", "Mode", "single", [["single", "Single date"], ["range", "Date range"]]), choice("start", "Week starts on", "sunday", [["sunday", "Sunday"], ["monday", "Monday"]]), choice("shape", "Day shape", "circle", [["circle", "Circle"], ["rounded", "Rounded"], ["square", "Square"]]), colorControl("ink"), { type: "toggle", key: "noWeekends", label: "Disable weekends", default: false }],
    render: (v) => <DateDemo v={v} />,
  },
} satisfies Record<string, Sample>;
