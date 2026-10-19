import type { ReactNode } from "react";

export type Option = { value: string; label: string };

/** One tweakable setting shown under the live sample. */
export type Control =
  | { type: "choice"; key: string; label: string; options: Option[]; default: string }
  | { type: "toggle"; key: string; label: string; default: boolean }
  | { type: "range"; key: string; label: string; min: number; max: number; step: number; default: number; unit?: string }
  | { type: "text"; key: string; label: string; default: string; maxLength?: number };

export type Values = Record<string, string | number | boolean>;

export type Sample = {
  /** One short line telling the person what to try. */
  hint: string;
  controls: Control[];
  render: (values: Values) => ReactNode;
};

export const str = (v: Values, key: string) => String(v[key]);
export const num = (v: Values, key: string) => Number(v[key]);
export const bool = (v: Values, key: string) => Boolean(v[key]);

export function defaultsFor(controls: Control[]): Values {
  return Object.fromEntries(controls.map((control) => [control.key, control.default]));
}
