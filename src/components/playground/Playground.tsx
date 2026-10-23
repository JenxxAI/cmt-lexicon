"use client";

import { useEffect, useId, useState, type CSSProperties } from "react";
import { ColorLab } from "./ColorLab";
import { Controls } from "./Controls";
import { cssVars } from "./color";
import { usePalette } from "./palette-store";
import { SAMPLES } from "./samples";
import { defaultsFor, type Values } from "./types";
import type { SampleId } from "./sample-ids";

export function Playground({ id, name }: { id: SampleId; name: string }) {
  const sample = SAMPLES[id];
  const palette = usePalette();
  const [showSettings, setShowSettings] = useState(false);
  const panel = useId();
  const hasColor = sample.controls.some((control) => control.key === "color");
  const [values, setValues] = useState<Values>(() => defaultsFor(sample.controls));
  const defaults: Values = { ...defaultsFor(sample.controls), ...(hasColor && palette.all ? { color: "custom" } : {}) };
  const dirty = sample.controls.some((control) => values[control.key] !== defaults[control.key]);

  // "Use my color on every component": switch this sample to Custom when the saved palette asks for it.
  useEffect(() => {
    if (hasColor && palette.all) setValues((current) => ({ ...current, color: "custom" }));
  }, [hasColor, palette.all]);

  const reset = () => setValues(defaults);

  return (
    <section aria-label={`${name} interactive playground`} style={cssVars(palette) as CSSProperties} className="overflow-hidden rounded-[28px] bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-rule py-1.5 pl-5 pr-3">
        <h2 className="font-display text-lg font-semibold">Try it</h2>
        <button
          type="button"
          aria-expanded={showSettings}
          aria-controls={panel}
          onClick={() => setShowSettings((open) => !open)}
          className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition-colors motion-reduce:transition-none ${showSettings ? "bg-ink text-white hover:bg-body" : "bg-line hover:bg-rule"}`}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
          Settings
        </button>
      </div>

      <div className="flex min-h-64 flex-col items-center justify-center gap-3 bg-stage p-5 sm:p-8">{sample.render(values)}</div>
      <p className="px-5 pt-3 text-xs text-muted">{sample.hint}</p>

      <div id={panel} hidden={!showSettings}>
      <div className="p-5 pt-3">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-semibold">Settings</h3>
          <button
            type="button"
            onClick={reset}
            disabled={!dirty}
            className="min-h-11 rounded-full bg-line px-4 text-sm font-medium hover:bg-rule disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-line"
          >
            Reset
          </button>
        </div>
        <Controls controls={sample.controls} values={values} onChange={(key, value) => setValues((current) => ({ ...current, [key]: value }))} />
      </div>

      {hasColor && <ColorLab palette={palette} onUse={() => setValues((current) => ({ ...current, color: "custom" }))} />}
      </div>
    </section>
  );
}
