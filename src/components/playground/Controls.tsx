"use client";

import { useId } from "react";
import type { Control, Values } from "./types";

const legend = "mb-2 block font-mono text-xs uppercase tracking-wide text-muted";

export function Controls({
  controls,
  values,
  onChange,
}: {
  controls: Control[];
  values: Values;
  onChange: (key: string, value: string | number | boolean) => void;
}) {
  const group = useId();
  return (
    <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
      {controls.map((control) => {
        const value = values[control.key];
        const name = `${group}-${control.key}`;

        if (control.type === "choice") {
          return (
            <fieldset key={control.key} className="min-w-0 sm:col-span-2">
              <legend className={legend}>{control.label}</legend>
              <div className="flex flex-wrap gap-2">
                {control.options.map((option) => (
                  <label key={option.value} className="relative cursor-pointer">
                    <input
                      type="radio"
                      name={name}
                      value={option.value}
                      checked={value === option.value}
                      onChange={() => onChange(control.key, option.value)}
                      className="peer sr-only"
                    />
                    <span className="inline-flex min-h-11 items-center rounded-full bg-line px-4 text-sm font-medium transition-colors hover:bg-rule peer-checked:bg-ink peer-checked:text-white peer-checked:hover:bg-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-deep motion-reduce:transition-none">
                      {option.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          );
        }

        if (control.type === "toggle") {
          return (
            <label key={control.key} className="flex min-h-11 cursor-pointer items-center justify-between gap-3">
              <span className="text-sm font-medium">{control.label}</span>
              <input
                type="checkbox"
                role="switch"
                checked={Boolean(value)}
                onChange={(event) => onChange(control.key, event.target.checked)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className="relative h-7 w-12 shrink-0 rounded-full bg-muted transition-colors after:absolute after:left-1 after:top-1 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:bg-ink peer-checked:after:translate-x-5 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-deep motion-reduce:transition-none motion-reduce:after:transition-none"
              />
            </label>
          );
        }

        if (control.type === "range") {
          return (
            <label key={control.key} className="block min-w-0">
              <span className="flex items-baseline justify-between gap-3 text-sm font-medium">
                <span>{control.label}</span>
                <output className="font-mono text-muted">
                  {String(value)}
                  {control.unit ?? ""}
                </output>
              </span>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={Number(value)}
                onChange={(event) => onChange(control.key, Number(event.target.value))}
                className="mt-1 h-11 w-full accent-ink"
              />
            </label>
          );
        }

        return (
          <label key={control.key} className="block min-w-0">
            <span className="text-sm font-medium">{control.label}</span>
            <input
              type="text"
              value={String(value)}
              maxLength={control.maxLength}
              onChange={(event) => onChange(control.key, event.target.value)}
              className="mt-2 min-h-11 w-full rounded-2xl border border-rule bg-surface px-4 text-sm focus-visible:outline-2 focus-visible:outline-offset-2"
            />
          </label>
        );
      })}
    </div>
  );
}
