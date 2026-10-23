import { useEffect, useId, useRef, useState } from "react";
import styles from "./Playground.module.css";
import { BOX_RADIUS, boxRadiusControl, colorControl, tone } from "./tones";
import { bool, num, str, type Sample, type Values } from "./types";

const choice = (key: string, label: string, def: string, options: [string, string][]) => ({ type: "choice" as const, key, label, default: def, options: options.map(([value, text]) => ({ value, label: text })) });
const xIcon = <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>;

/* ---------- Modal + Drawer (native <dialog>) ---------- */

function DialogDemo({ v, drawer }: { v: Values; drawer: boolean }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const press = useRef(false);
  const title = useId();
  const body = useId();
  const t = tone(str(v, "color"));
  const left = str(v, "side") === "left";

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  const outside = (event: React.MouseEvent<HTMLDialogElement>) => {
    const b = event.currentTarget.getBoundingClientRect();
    return event.clientX < b.left || event.clientX > b.right || event.clientY < b.top || event.clientY > b.bottom;
  };
  const size = { sm: "28rem", md: "36rem", lg: "46rem" }[str(v, "size") || "sm"];

  return (
    <>
      <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" className={`min-h-12 rounded-full px-6 text-sm font-semibold hover:opacity-85 ${t.solid}`}>
        Open {drawer ? "drawer" : "modal"}
      </button>
      <p className="text-sm text-muted">{open ? "Open" : "Closed"} · Esc or the backdrop closes it</p>
      <dialog
        ref={dialog}
        aria-labelledby={title}
        aria-describedby={body}
        onClose={() => { setOpen(false); trigger.current?.focus(); }}
        onPointerDown={(event) => { press.current = event.target === event.currentTarget && outside(event as unknown as React.MouseEvent<HTMLDialogElement>); }}
        onClick={(event) => { if (bool(v, "backdropClose") && press.current && event.target === event.currentTarget && outside(event)) setOpen(false); press.current = false; }}
        className={`${styles.backdrop} ${drawer ? (left ? styles.slideLeft : styles.slideRight) : styles.pop} bg-surface p-6 text-ink shadow-2xl ${drawer ? "h-dvh max-h-dvh rounded-none" : BOX_RADIUS[str(v, "radius")]}`}
        style={{ ["--dim" as string]: num(v, "dim"), ...(drawer ? { margin: left ? "0 auto 0 0" : "0 0 0 auto", width: `min(${num(v, "width")}px, 92vw)` } : { margin: "auto", width: `min(${size}, calc(100% - 2rem))`, maxHeight: "calc(100dvh - 2rem)" }) }}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 id={title} className="font-display text-2xl font-bold">{drawer ? "Your side panel" : "Delete this project?"}</h3>
          {bool(v, "close") && <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="-mr-2 -mt-1 grid size-11 shrink-0 place-items-center rounded-full hover:bg-line">{xIcon}</button>}
        </div>
        <p id={body} className="mt-3 text-body">{drawer ? "A drawer keeps extra details at the edge of the screen. Close it to return to the page." : "This cannot be undone. Everything inside it will be removed for good."}</p>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" autoFocus onClick={() => setOpen(false)} className="min-h-11 rounded-full bg-line px-5 text-sm font-medium hover:bg-rule">{drawer ? "Close" : "Cancel"}</button>
          {!drawer && <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-full bg-red px-5 text-sm font-semibold text-white hover:opacity-85">Delete</button>}
        </div>
      </dialog>
    </>
  );
}

/* ---------- Popover ---------- */

function PopoverDemo({ v }: { v: Values }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const t = tone(str(v, "color"));
  const above = str(v, "placement") === "top";
  const align = { start: "left-0", center: "left-1/2 -translate-x-1/2", end: "right-0" }[str(v, "align")];

  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); };
    const esc = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", esc); };
  }, [open]);

  return (
    <div className={`flex flex-col items-center ${above ? "pt-36" : "pb-36"}`}>
      <div ref={box} className="relative">
        <button ref={trigger} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={`min-h-12 rounded-full px-6 text-sm font-semibold hover:opacity-85 ${t.solid}`}>{open ? "Close" : "Open"} popover</button>
        <div id={id} hidden={!open} className={`${styles.fade} absolute z-20 bg-surface p-4 shadow-xl ring-1 ring-black/5 ${BOX_RADIUS[str(v, "radius")]} ${align} ${above ? "bottom-full mb-3" : "top-full mt-3"}`} style={{ width: num(v, "width") }}>
          {bool(v, "arrow") && <span aria-hidden="true" className={`absolute size-3 rotate-45 bg-surface ${above ? "-bottom-1.5" : "-top-1.5"} ${str(v, "align") === "end" ? "right-6" : str(v, "align") === "center" ? "left-1/2 -ml-1.5" : "left-6"}`} />}
          <h3 className="font-display text-lg font-bold">A little more detail</h3>
          <p className="mt-1 text-sm text-body">Stays close to its button. Click outside or press Esc to dismiss.</p>
          <button type="button" onClick={() => { setOpen(false); trigger.current?.focus(); }} className="mt-3 min-h-11 rounded-full bg-line px-4 text-sm font-medium hover:bg-rule">Got it</button>
        </div>
      </div>
      <p className="mt-4 text-sm text-muted">The rest of the page stays usable.</p>
    </div>
  );
}

/* ---------- Toast ---------- */

const KIND: Record<string, { tone: string; glyph: string; text: string }> = {
  info: { tone: "blue", glyph: "i", text: "A new version is ready." },
  success: { tone: "green", glyph: "✓", text: "Changes saved." },
  warning: { tone: "orange", glyph: "!", text: "Storage is almost full." },
  error: { tone: "red", glyph: "×", text: "Could not send. Try again." },
};

function ToastDemo({ v }: { v: Values }) {
  const [toasts, setToasts] = useState<{ id: number }[]>([]);
  const next = useRef(1);
  const timers = useRef<Map<number, number>>(new Map());
  const kind = KIND[str(v, "type")];
  const t = tone(kind.tone);
  const secs = num(v, "duration");
  const pos = str(v, "position");

  useEffect(() => { const map = timers.current; return () => map.forEach((h) => window.clearTimeout(h)); }, []);

  function remove(id: number) {
    window.clearTimeout(timers.current.get(id));
    timers.current.delete(id);
    setToasts((list) => list.filter((x) => x.id !== id));
  }
  function show() {
    const id = next.current++;
    setToasts((list) => [...list.slice(-2), { id }]);
    if (secs > 0) timers.current.set(id, window.setTimeout(() => remove(id), secs * 1000));
  }

  const place = { "top-left": "top-3 left-3 items-start", "top-right": "top-3 right-3 items-end", "bottom-left": "bottom-3 left-3 items-start", "bottom-right": "bottom-3 right-3 items-end" }[pos];
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button type="button" onClick={show} className="min-h-12 rounded-full bg-ink px-6 text-sm font-semibold text-white hover:bg-body">Show toast</button>
      <div className="relative h-52 w-full max-w-md overflow-hidden rounded-2xl border border-rule bg-surface">
        <p aria-hidden="true" className="p-4 text-sm text-muted">Your page content</p>
        <div role="status" aria-live="polite" className={`absolute flex w-[calc(100%-1.5rem)] flex-col gap-2 ${place}`}>
          {toasts.map(({ id }) => (
            <div key={id} className={`${styles.fade} flex w-full max-w-xs items-center gap-3 rounded-2xl bg-ink py-2 pl-3 pr-1 text-sm text-white shadow-xl`}>
              <span aria-hidden="true" className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${t.solid}`}>{kind.glyph}</span>
              <span className="min-w-0 flex-1">{kind.text}</span>
              {bool(v, "action") && <button type="button" onClick={() => remove(id)} className="min-h-11 rounded-full px-3 font-semibold underline underline-offset-4 hover:bg-white/10">Undo</button>}
              <button type="button" aria-label="Dismiss notification" onClick={() => remove(id)} className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-white/10">{xIcon}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export const OVERLAY_SAMPLES = {
  modal: {
    hint: "Focus is trapped inside. Esc, the backdrop, or a button closes it and returns focus.",
    controls: [choice("size", "Width", "sm", [["sm", "Small"], ["md", "Medium"], ["lg", "Large"]]), colorControl("ink"), boxRadiusControl("round"), { type: "range", key: "dim", label: "Background dim", min: 0, max: 80, step: 10, default: 40, unit: "%" }, { type: "toggle", key: "close", label: "Close (×) button", default: true }, { type: "toggle", key: "backdropClose", label: "Click backdrop to close", default: true }],
    render: (v) => <DialogDemo v={v} drawer={false} />,
  },
  drawer: {
    hint: "A drawer is a modal that slides from an edge.",
    controls: [choice("side", "Side", "right", [["right", "Right"], ["left", "Left"]]), colorControl("ink"), { type: "range", key: "width", label: "Width", min: 280, max: 480, step: 20, default: 380, unit: "px" }, { type: "range", key: "dim", label: "Background dim", min: 0, max: 80, step: 10, default: 40, unit: "%" }, { type: "toggle", key: "close", label: "Close (×) button", default: true }, { type: "toggle", key: "backdropClose", label: "Click backdrop to close", default: true }],
    render: (v) => <DialogDemo v={v} drawer />,
  },
  popover: {
    hint: "Open it, then click elsewhere or press Esc.",
    controls: [choice("placement", "Opens", "bottom", [["bottom", "Below"], ["top", "Above"]]), choice("align", "Align", "start", [["start", "Left"], ["center", "Center"], ["end", "Right"]]), colorControl("ink"), boxRadiusControl("round"), { type: "range", key: "width", label: "Width", min: 200, max: 320, step: 20, default: 260, unit: "px" }, { type: "toggle", key: "arrow", label: "Arrow", default: true }],
    render: (v) => <PopoverDemo v={v} />,
  },
  toast: {
    hint: "Show a few. Set the time to 0 to keep them until dismissed.",
    controls: [choice("type", "Type", "success", [["info", "Info"], ["success", "Success"], ["warning", "Warning"], ["error", "Error"]]), choice("position", "Position", "bottom-right", [["top-left", "Top left"], ["top-right", "Top right"], ["bottom-left", "Bottom left"], ["bottom-right", "Bottom right"]]), { type: "range", key: "duration", label: "Disappears after (0 = never)", min: 0, max: 10, step: 1, default: 4, unit: "s" }, { type: "toggle", key: "action", label: "Undo button", default: true }],
    render: (v) => <ToastDemo v={v} />,
  },
} satisfies Record<string, Sample>;
