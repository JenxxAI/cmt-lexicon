"use client";

import { useEffect, useState } from "react";
import { CodeTabs, type CodeTab } from "../CodeTabs";
import { PromptPanel } from "../PromptPanel";
import { Playground } from "./Playground";
import { usePalette } from "./palette-store";
import { SAMPLES } from "./samples";
import type { SampleId } from "./sample-ids";
import { defaultsFor, type Values } from "./types";
import { resolveOutput } from "./output";

export function ComponentWorkbench({ id, name, prompts, tabs }: {
  id: SampleId; name: string; prompts: { short: string; detailed: string }; tabs: CodeTab[];
}) {
  const sample = SAMPLES[id];
  const palette = usePalette();
  const [values, setValues] = useState<Values>(() => defaultsFor(sample.controls));
  const [settled, setSettled] = useState(values);
  const [announcement, setAnnouncement] = useState("");
  const hasColor = sample.controls.some(c => c.key === "color");
  useEffect(() => {
    if (hasColor && palette.all) setValues(v => ({ ...v, color: "custom" }));
  }, [hasColor, palette.all]);
  useEffect(() => {
    // Only typing is delayed; choice, range and toggle controls update immediately.
    const typing = sample.controls.some(c => c.type === "text" && values[c.key] !== settled[c.key]);
    if (!typing) { setSettled(values); return; }
    const timer = setTimeout(() => setSettled(values), 300);
    return () => clearTimeout(timer);
  }, [values, settled, sample]);
  const { prompts: output, tabs: currentTabs, count: customized } = resolveOutput(id, sample.controls, settled, palette, prompts, tabs);
  useEffect(() => {
    const timer = setTimeout(() => setAnnouncement(customized ? `Prompt and code updated. ${output.detailed}` : "Default prompt and code."), 300);
    return () => clearTimeout(timer);
  }, [customized, output.detailed]);
  function reset() {
    const defaults = defaultsFor(sample.controls);
    setValues(defaults); setSettled(defaults);
  }
  return <div className="flex min-w-0 flex-[1_1_460px] flex-col gap-5 max-lg:contents">
    <div className="max-lg:order-3 max-lg:min-w-0 max-lg:w-full"><Playground id={id} name={name} values={values} setValues={setValues} palette={palette} /></div>
    <div className="max-lg:order-2 max-lg:min-w-0 max-lg:w-full"><PromptPanel {...output} customized={customized} onReset={reset} /><span className="sr-only" role="status" aria-live="polite">{announcement}</span></div>
    <div className="min-w-0 max-lg:order-4 max-lg:w-full"><CodeTabs tabs={currentTabs} customized={Boolean(customized)} /></div>
  </div>;
}
