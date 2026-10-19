"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { CopyButton } from "./CopyButton";

export type CodeTab = { id: string; label: string; code: string };

export function CodeTabs({ tabs }: { tabs: CodeTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const baseId = useId();
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  if (tabs.length === 0) return null;
  const current = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = tabs.findIndex((tab) => tab.id === current.id);
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = tabs.length - 1;
    else return;
    event.preventDefault();
    setActiveId(tabs[next].id);
    buttons.current[tabs[next].id]?.focus();
  }

  return (
    <section aria-label="Code snippets" className="overflow-hidden rounded-[18px] bg-ink">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-2">
        <div role="tablist" aria-label="Snippet language" onKeyDown={onKeyDown} className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const selected = tab.id === current.id;
            return (
              <button
                key={tab.id}
                ref={(node) => {
                  buttons.current[tab.id] = node;
                }}
                id={`${baseId}-tab-${tab.id}`}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls={`${baseId}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveId(tab.id)}
                className={`min-h-11 rounded-t-[10px] px-3.5 font-mono text-[13px] ${
                  selected ? "bg-code text-white" : "text-dim hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        <CopyButton text={current.code} label="Copy code" variant="ghost" iconOnly />
      </div>
      <div id={`${baseId}-panel`} role="tabpanel" aria-labelledby={`${baseId}-tab-${current.id}`}>
        <pre
          tabIndex={0}
          className="overflow-x-auto bg-code p-5 font-mono text-[13px] leading-[1.65] text-line"
        >
          <code>{current.code}</code>
        </pre>
      </div>
    </section>
  );
}
