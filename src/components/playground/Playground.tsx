"use client";

import { useEffect, useState, type CSSProperties } from "react";
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
        <span className="font-mono text-xs text-muted">Interactive</span>
      </div>

      <div className="flex min-h-64 flex-col items-center justify-center gap-3 bg-stage p-5 sm:p-8">{sample.render(values)}</div>
      <p className="px-5 pt-3 text-xs text-muted">{sample.hint}</p>

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
    </section>
  );
}
