import { useEffect, useId, useRef, useState } from "react";
import { RADIUS, colorControl, radiusControl, sizeControl, tone } from "./tones";
import { bool, num, str, type Sample, type Values } from "./types";

/* ---------- Button ---------- */

const BUTTON_SIZE: Record<string, string> = { sm: "min-h-11 px-4 text-sm", md: "min-h-12 px-6 text-base", lg: "min-h-14 px-8 text-lg" };

function ButtonDemo({ v }: { v: Values }) {
  const [clicks, setClicks] = useState(0);
  const t = tone(str(v, "color"));
  const variant = str(v, "variant");
  const look =
    variant === "solid" ? `${t.solid} hover:opacity-85`
    : variant === "soft" ? `${t.soft} hover:opacity-80`
    : variant === "outline" ? `border-2 bg-transparent ${t.outline} hover:bg-surface`
    : `bg-transparent ${t.text} hover:bg-line`;
  const loading = bool(v, "loading");

  return (
    <>
      <button
        type="button"
        disabled={bool(v, "disabled") || loading}
        aria-busy={loading || undefined}
        onClick={() => setClicks((n) => n + 1)}
        className={`inline-flex items-center justify-center gap-2.5 font-semibold transition-[opacity,background-color] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none ${BUTTON_SIZE[str(v, "size")]} ${RADIUS[str(v, "radius")]} ${look}`}
      >
        {loading && <span aria-hidden="true" className="size-4 rounded-full border-2 border-current border-t-transparent motion-safe:animate-spin" />}
        {loading ? "Saving…" : str(v, "label") || "Button"}
      </button>
      <p aria-live="polite" className="text-sm text-muted">{clicks > 0 ? `Clicked ${clicks} ${clicks === 1 ? "time" : "times"}` : "Click the button"}</p>
    </>
  );
}

/* ---------- Badge ---------- */

function BadgeDemo({ v }: { v: Values }) {
  const [gone, setGone] = useState(false);
  const t = tone(str(v, "color"));
  const variant = str(v, "variant");
  const look = variant === "solid" ? t.solid : variant === "soft" ? t.soft : `border-2 bg-transparent ${t.outline}`;
  const removable = bool(v, "removable");
  const hidden = removable && gone;

  return (
    <>
      {hidden ? (
        <button type="button" onClick={() => setGone(false)} className="min-h-11 rounded-full bg-line px-4 text-sm font-medium hover:bg-rule">Bring it back</button>
      ) : (
        <span className={`inline-flex items-center gap-2 py-1 pl-3 text-sm font-semibold ${removable ? "pr-1" : "pr-3"} ${str(v, "shape") === "pill" ? "rounded-full" : "rounded-md"} ${look}`}>
          {bool(v, "dot") && <span aria-hidden="true" className="size-2 rounded-full bg-current" />}
          {str(v, "label") || "Badge"}
          {removable && (
            <button type="button" aria-label={`Remove ${str(v, "label") || "badge"}`} onClick={() => setGone(true)} className="grid size-8 place-items-center rounded-full hover:bg-black/10">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
            </button>
          )}
        </span>
      )}
      <p className="text-sm text-muted">{removable ? "Remove it with the ×" : "Badges label status or counts"}</p>
    </>
  );
}

/* ---------- Alert ---------- */

const ALERTS: Record<string, { tone: string; glyph: string; title: string; body: string; role: "status" | "alert" }> = {
  info: { tone: "blue", glyph: "i", title: "Heads up", body: "A new version is available. Refresh when you are ready.", role: "status" },
  success: { tone: "green", glyph: "✓", title: "All saved", body: "Your changes were saved to the cloud.", role: "status" },
  warning: { tone: "orange", glyph: "!", title: "Almost full", body: "You have used 90% of your storage.", role: "status" },
  error: { tone: "red", glyph: "×", title: "Something went wrong", body: "We could not save your changes. Try again.", role: "alert" },
};

function AlertDemo({ v }: { v: Values }) {
  const [gone, setGone] = useState(false);
  const kind = ALERTS[str(v, "type")];
  const t = tone(kind.tone);
  const dismissible = bool(v, "dismissible");
  const hidden = dismissible && gone;

  if (hidden) {
    return <button type="button" onClick={() => setGone(false)} className="min-h-11 rounded-full bg-line px-4 text-sm font-medium hover:bg-rule">Show the alert again</button>;
  }
  return (
    <div role={kind.role} className={`flex w-full max-w-md items-start gap-3 p-4 text-ink ${RADIUS[str(v, "radius")]} ${t.soft.split(" ")[0]}`}>
      <span aria-hidden="true" className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold ${t.solid}`}>{kind.glyph}</span>
      <div className="min-w-0 flex-1">
        {bool(v, "title") && <p className="font-display text-base font-bold">{kind.title}</p>}
        <p className="text-sm">{kind.body}</p>
      </div>
      {dismissible && (
        <button type="button" aria-label="Dismiss alert" onClick={() => setGone(true)} className="-m-2 grid size-11 shrink-0 place-items-center rounded-full hover:bg-black/10">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 3l10 10M13 3L3 13" /></svg>
        </button>
      )}
    </div>
  );
}

/* ---------- Toggle switch ---------- */

const SWITCH: Record<string, { track: string; thumb: string; move: string }> = {
  sm: { track: "h-6 w-11", thumb: "size-5", move: "translate-x-5" },
  md: { track: "h-8 w-14", thumb: "size-6", move: "translate-x-7" },
  lg: { track: "h-10 w-[4.5rem]", thumb: "size-8", move: "translate-x-9" },
};

function SwitchDemo({ v }: { v: Values }) {
  const [on, setOn] = useState(true);
  const s = SWITCH[str(v, "size")];
  const square = str(v, "shape") === "square";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={bool(v, "disabled")}
      onClick={() => setOn((value) => !value)}
      className="inline-flex min-h-11 items-center gap-3 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`relative inline-block shrink-0 transition-colors motion-reduce:transition-none ${s.track} ${square ? "rounded-md" : "rounded-full"} ${on ? tone(str(v, "color")).fill : "bg-muted"}`}>
        <span className={`absolute left-0.5 top-0.5 bg-white shadow transition-transform motion-reduce:transition-none ${s.thumb} ${square ? "rounded-[5px]" : "rounded-full"} ${on ? s.move : ""}`} />
      </span>
      <span className="text-base font-medium">{str(v, "label") || "Setting"}: {on ? "On" : "Off"}</span>
    </button>
  );
}

/* ---------- Checkbox ---------- */

const BOX: Record<string, string> = { sm: "size-5", md: "size-6", lg: "size-8" };
const OPTIONS = ["Email", "Text message", "Push notification"];

function CheckboxDemo({ v }: { v: Values }) {
  const [checked, setChecked] = useState<boolean[]>([true, false, false]);
  const parent = useRef<HTMLInputElement>(null);
  const all = checked.every(Boolean);
  const some = checked.some(Boolean);
  const disabled = bool(v, "disabled");
  const style = { accentColor: tone(str(v, "color")).css };
  const box = `shrink-0 ${BOX[str(v, "size")]}`;

  useEffect(() => {
    if (parent.current) parent.current.indeterminate = some && !all;
  }, [some, all, v]);

  return (
    <fieldset className="w-full max-w-xs" disabled={disabled}>
      <legend className="sr-only">Notification channels</legend>
      {bool(v, "parent") && (
        <label className="flex min-h-11 cursor-pointer items-center gap-3 font-semibold has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
          <input ref={parent} type="checkbox" checked={all} onChange={() => setChecked(checked.map(() => !all))} className={box} style={style} />
          All notifications
        </label>
      )}
      <div className={bool(v, "parent") ? "ml-8" : ""}>
        {OPTIONS.map((label, index) => (
          <label key={label} className="flex min-h-11 cursor-pointer items-center gap-3 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
            <input type="checkbox" checked={checked[index]} onChange={() => setChecked(checked.map((value, i) => (i === index ? !value : value)))} className={box} style={style} />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/* ---------- Radio ---------- */

const SPEEDS = ["Standard (3 to 5 days)", "Express (1 to 2 days)", "Same day"];

function RadioDemo({ v }: { v: Values }) {
  const [picked, setPicked] = useState(0);
  const name = useId();
  const style = { accentColor: tone(str(v, "color")).css };
  const inline = str(v, "layout") === "inline";
  const lockLast = bool(v, "lockLast");
  const current = lockLast && picked === SPEEDS.length - 1 ? 0 : picked;
  return (
    <fieldset className="w-full max-w-md">
      <legend className="mb-1 font-display text-base font-bold">Delivery speed</legend>
      <div className={inline ? "flex flex-wrap gap-x-6" : ""}>
        {SPEEDS.map((label, index) => {
          const locked = lockLast && index === SPEEDS.length - 1;
          return (
            <label key={label} className={`flex min-h-11 items-center gap-3 ${locked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}>
              <input type="radio" name={name} checked={current === index} disabled={locked} onChange={() => setPicked(index)} className={`shrink-0 ${BOX[str(v, "size")]}`} style={style} />
              {label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

/* ---------- Slider ---------- */

function SliderDemo({ v }: { v: Values }) {
  const [raw, setRaw] = useState(40);
  const max = num(v, "max");
  const step = num(v, "step");
  const value = Math.min(max, Math.round(raw / step) * step);
  const id = useId();
  return (
    <div className="w-full max-w-sm">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="font-display text-base font-bold">Volume</label>
        {bool(v, "showValue") && <output htmlFor={id} className="font-mono text-sm">{value}</output>}
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={max}
        step={step}
        value={value}
        disabled={bool(v, "disabled")}
        onChange={(event) => setRaw(Number(event.target.value))}
        className="mt-1 h-11 w-full cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
        style={{ accentColor: tone(str(v, "color")).css }}
      />
      <div className="flex justify-between font-mono text-xs text-muted"><span>0</span><span>{max}</span></div>
    </div>
  );
}

export const FORM_SAMPLES = {
  button: {
    hint: "Click it, then change the look. Loading and disabled block clicks.",
    controls: [
      { type: "text", key: "label", label: "Label", default: "Save changes", maxLength: 24 },
      { type: "choice", key: "variant", label: "Style", default: "solid", options: [{ value: "solid", label: "Solid" }, { value: "soft", label: "Soft" }, { value: "outline", label: "Outline" }, { value: "text", label: "Text" }] },
      colorControl("ink"),
      sizeControl("md"),
      radiusControl("pill"),
      { type: "toggle", key: "loading", label: "Loading", default: false },
      { type: "toggle", key: "disabled", label: "Disabled", default: false },
    ],
    render: (v) => <ButtonDemo v={v} />,
  },
  badge: {
    hint: "Turn on Removable to try the × button.",
    controls: [
      { type: "text", key: "label", label: "Text", default: "New", maxLength: 16 },
      { type: "choice", key: "variant", label: "Style", default: "soft", options: [{ value: "solid", label: "Solid" }, { value: "soft", label: "Soft" }, { value: "outline", label: "Outline" }] },
      colorControl("orange"),
      { type: "choice", key: "shape", label: "Shape", default: "pill", options: [{ value: "pill", label: "Pill" }, { value: "square", label: "Square" }] },
      { type: "toggle", key: "dot", label: "Status dot", default: false },
      { type: "toggle", key: "removable", label: "Removable", default: false },
    ],
    render: (v) => <BadgeDemo v={v} />,
  },
  alert: {
    hint: "Errors use role=alert so screen readers announce them right away.",
    controls: [
      { type: "choice", key: "type", label: "Type", default: "info", options: [{ value: "info", label: "Info" }, { value: "success", label: "Success" }, { value: "warning", label: "Warning" }, { value: "error", label: "Error" }] },
      radiusControl("round"),
      { type: "toggle", key: "title", label: "Show title", default: true },
      { type: "toggle", key: "dismissible", label: "Dismissible", default: true },
    ],
    render: (v) => <AlertDemo v={v} />,
  },
  "toggle-switch": {
    hint: "Click or press Space. The state is announced as on or off.",
    controls: [
      { type: "text", key: "label", label: "Label", default: "Notifications", maxLength: 24 },
      colorControl("green"),
      sizeControl("md"),
      { type: "choice", key: "shape", label: "Shape", default: "round", options: [{ value: "round", label: "Round" }, { value: "square", label: "Square" }] },
      { type: "toggle", key: "disabled", label: "Disabled", default: false },
    ],
    render: (v) => <SwitchDemo v={v} />,
  },
  checkbox: {
    hint: "Tick the options. The parent shows a dash when only some are picked.",
    controls: [
      colorControl("ink"),
      sizeControl("md"),
      { type: "toggle", key: "parent", label: "Select-all parent", default: true },
      { type: "toggle", key: "disabled", label: "Disabled", default: false },
    ],
    render: (v) => <CheckboxDemo v={v} />,
  },
  radio: {
    hint: "Only one choice can be picked. Arrow keys move between options.",
    controls: [
      colorControl("ink"),
      sizeControl("md"),
      { type: "choice", key: "layout", label: "Layout", default: "stacked", options: [{ value: "stacked", label: "Stacked" }, { value: "inline", label: "Inline" }] },
      { type: "toggle", key: "lockLast", label: "Lock last option", default: false },
    ],
    render: (v) => <RadioDemo v={v} />,
  },
  slider: {
    hint: "Drag it, or focus it and use the arrow keys.",
    controls: [
      colorControl("ink"),
      { type: "range", key: "max", label: "Maximum", min: 20, max: 200, step: 10, default: 100 },
      { type: "choice", key: "step", label: "Step", default: "1", options: [{ value: "1", label: "1" }, { value: "5", label: "5" }, { value: "10", label: "10" }] },
      { type: "toggle", key: "showValue", label: "Show value", default: true },
      { type: "toggle", key: "disabled", label: "Disabled", default: false },
    ],
    render: (v) => <SliderDemo v={v} />,
  },
} satisfies Record<string, Sample>;
