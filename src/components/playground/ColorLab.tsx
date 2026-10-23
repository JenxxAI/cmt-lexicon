"use client";

import { useEffect, useState } from "react";
import { PRESETS, cssFill, fixContrast, normalizeHex, pickOn, randomPalette, type Palette } from "./color";
import { setPalette } from "./palette-store";

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };

const legend = "mb-2 block font-mono text-xs uppercase tracking-wide text-muted";
const pill = "inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors motion-reduce:transition-none";

function DropperIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 7l3 3M4 20l1-4 9.5-9.5a2.1 2.1 0 013 3L8 19l-4 1zM15 5l4 4" />
    </svg>
  );
}

function HexField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const invalid = text.trim() !== "" && normalizeHex(text) === null;
  return (
    <input
      type="text"
      aria-label={`${label} hex code`}
      aria-invalid={invalid || undefined}
      value={text}
      maxLength={7}
      spellCheck={false}
      onChange={(event) => {
        setText(event.target.value);
        const hex = normalizeHex(event.target.value);
        if (hex) onChange(hex);
      }}
      className={`min-h-11 w-28 rounded-2xl border bg-surface px-3 font-mono text-sm ${invalid ? "border-red" : "border-rule"}`}
    />
  );
}

function ColorRow({ label, value, canPick, onChange }: { label: string; value: string; canPick: boolean; onChange: (hex: string) => void }) {
  async function pickFromScreen() {
    try {
      const EyeDropper = (window as unknown as { EyeDropper: EyeDropperCtor }).EyeDropper;
      const result = await new EyeDropper().open();
      const hex = normalizeHex(result.sRGBHex);
      if (hex) onChange(hex);
    } catch {
      /* cancelled with Escape */
    }
  }
  return (
    <div className="flex items-center gap-2">
      <span className="w-16 shrink-0 text-sm font-medium">{label}</span>
      <input
        type="color"
        aria-label={`${label} color picker`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="size-11 shrink-0 cursor-pointer rounded-xl border border-rule bg-surface p-1"
      />
      <HexField label={label} value={value} onChange={onChange} />
      {canPick && (
        <button type="button" aria-label={`Pick ${label.toLowerCase()} from anywhere on screen`} title="Eyedropper" onClick={pickFromScreen} className="grid size-11 shrink-0 place-items-center rounded-full bg-line hover:bg-rule">
          <DropperIcon />
        </button>
      )}
    </div>
  );
}

export function ColorLab({ palette, onUse }: { palette: Palette; onUse: () => void }) {
  const [canPick, setCanPick] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setCanPick("EyeDropper" in window), []);

  const { ratio } = pickOn(palette);
  const passes = ratio >= 4.5;
  const gradient = palette.mode === "gradient";

  function update(patch: Partial<Palette>) {
    setPalette(patch);
    onUse();
  }

  async function copyCss() {
    try {
      await navigator.clipboard.writeText(`background: ${cssFill(palette)};\ncolor: ${pickOn(palette).on};`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked */
    }
  }

  return (
    <section aria-labelledby="colors-heading" className="border-t border-rule p-5">
      <h3 id="colors-heading" className="font-display text-lg font-semibold">Colors</h3>
      <p className="mt-1 text-sm text-muted">Pick, eyedrop, or generate a color, then choose <strong className="font-semibold text-ink">Custom</strong> under Color above.</p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <div
          aria-hidden="true"
          className="grid h-14 min-w-36 flex-[1_1_9rem] place-items-center rounded-2xl font-display text-lg font-extrabold [background:var(--cx-fill)] text-[color:var(--cx-on)]"
        >
          Aa Sample
        </div>
        <div className="min-w-0 flex-[1_1_12rem]">
          <p className="font-mono text-sm">
            <span className={passes ? "text-green" : "text-red"}>{passes ? "Passes AA" : "Low contrast"}</span> · {ratio.toFixed(1)}:1
          </p>
          {passes ? (
            <p className="text-xs text-muted">Text color is chosen for you.</p>
          ) : (
            <button type="button" onClick={() => update(fixContrast(palette))} className="mt-1 min-h-11 text-sm font-medium text-accent-deep underline underline-offset-4">Fix it for me</button>
          )}
        </div>
      </div>

      <fieldset className="mt-5">
        <legend className={legend}>Type</legend>
        <div className="flex gap-2">
          {(["solid", "gradient"] as const).map((mode) => (
            <label key={mode} className="relative cursor-pointer">
              <input type="radio" name="palette-mode" value={mode} checked={palette.mode === mode} onChange={() => update({ mode })} className="peer sr-only" />
              <span className="inline-flex min-h-11 items-center rounded-full bg-line px-4 text-sm font-medium capitalize hover:bg-rule peer-checked:bg-ink peer-checked:text-white peer-checked:hover:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-deep">{mode}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-4 flex flex-col gap-2">
        <ColorRow label={gradient ? "Start" : "Color"} value={palette.c1} canPick={canPick} onChange={(c1) => update({ c1 })} />
        {gradient && <ColorRow label="End" value={palette.c2} canPick={canPick} onChange={(c2) => update({ c2 })} />}
      </div>

      {gradient && (
        <label className="mt-3 block">
          <span className="flex items-baseline justify-between text-sm font-medium">
            <span>Angle</span>
            <output className="font-mono text-muted">{Math.round(palette.angle)}°</output>
          </span>
          <input type="range" min={0} max={360} step={15} value={palette.angle} onChange={(event) => update({ angle: Number(event.target.value) })} className="mt-1 h-11 w-full accent-ink" />
        </label>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => update(randomPalette(palette.all))} className={`${pill} bg-ink text-white hover:bg-body`}>Generate gradient</button>
        <button type="button" onClick={() => void copyCss()} className={`${pill} bg-line hover:bg-rule`}>{copied ? "Copied ✓" : "Copy CSS"}</button>
      </div>

      <fieldset className="mt-5">
        <legend className={legend}>Presets</legend>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              aria-label={`${preset.name} preset`}
              title={preset.name}
              onClick={() => update({ mode: "gradient", c1: preset.c1, c2: preset.c2, angle: preset.angle })}
              className="size-11 rounded-full border border-rule hover:scale-105 motion-reduce:hover:scale-100"
              style={{ background: `linear-gradient(${preset.angle}deg, ${preset.c1}, ${preset.c2})` }}
            />
          ))}
        </div>
      </fieldset>

      <label className="mt-5 flex min-h-11 cursor-pointer items-center justify-between gap-3">
        <span className="text-sm font-medium">
          Use my color on every component
          <span className="block text-xs font-normal text-muted">Saved on this device only.</span>
        </span>
        <input type="checkbox" role="switch" checked={palette.all} onChange={(event) => update({ all: event.target.checked })} className="peer sr-only" />
        <span aria-hidden="true" className="relative h-7 w-12 shrink-0 rounded-full bg-muted transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-ink peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-deep motion-reduce:transition-none motion-reduce:after:transition-none" />
      </label>
    </section>
  );
}
