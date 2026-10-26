"use client";

import { useMemo, useRef } from "react";
import type { SampleLanguage } from "@/lib/sample-source";
import styles from "./SampleCodeEditor.module.css";

function highlighted(source: string, language: SampleLanguage) {
  // Decorative, conservative highlighting; parsing and validation belong to Prettier.
  const pattern =
    language === "html"
      ? /(<!--[\s\S]*?-->|"[^"\n]*"|'[^'\n]*'|<\/?[\w-]+|\/?\s*>)/g
      : /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|let|var|function|return|if|else|for|new|true|false|null|document|window|async|await)\b|\b\d+(?:\.\d+)?(?:px|rem|em|%)?)/g;
  return source.split(pattern).map((part, index) => {
    const color = /^(<!--|\/\*|\/\/)/.test(part)
      ? "text-dim"
      : /^["'`]/.test(part)
        ? "text-green-soft"
        : /^\d/.test(part)
          ? "text-hi"
          : /^(<|\/?\s*>)/.test(part)
            ? "text-blue-soft"
            : "text-hi";
    return index % 2 ? (
      <span key={index} className={color}>
        {part}
      </span>
    ) : (
      part
    );
  });
}

export function SampleCodeEditor({
  value,
  language,
  onChange,
  onBlur,
  onCursor,
}: {
  value: string;
  language: SampleLanguage;
  onChange: (value: string) => void;
  onBlur: (nextTarget: EventTarget | null) => void;
  onCursor: (line: number, column: number) => void;
}) {
  const code = useRef<HTMLPreElement>(null);
  const numbers = useRef<HTMLPreElement>(null);
  const tokens = useMemo(() => highlighted(value, language), [value, language]);
  return (
    <div className={styles.editor}>
      <pre ref={code} aria-hidden="true" className={styles.code}>
        {tokens}
        {"\n"}
      </pre>
      <div aria-hidden="true" className={styles.gutter}>
        <pre ref={numbers} className={styles.numbers}>
          {Array.from(
            { length: value.split("\n").length },
            (_, index) => index + 1,
          ).join("\n")}
        </pre>
      </div>
      <textarea
        aria-label={`${{ html: "HTML", css: "CSS", js: "JavaScript" }[language]} code`}
        aria-describedby="editor-help"
        className={styles.input}
        value={value}
        wrap="off"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        onChange={(event) => onChange(event.target.value)}
        onBlur={(event) => onBlur(event.relatedTarget)}
        onSelect={(event) => {
          const before = event.currentTarget.value.slice(
            0,
            event.currentTarget.selectionStart,
          );
          const lines = before.split("\n");
          onCursor(lines.length, lines[lines.length - 1].length + 1);
        }}
        onScroll={(event) => {
          const { scrollTop, scrollLeft } = event.currentTarget;
          if (code.current)
            code.current.style.transform = `translate(${-scrollLeft}px, ${-scrollTop}px)`;
          if (numbers.current)
            numbers.current.style.transform = `translateY(${-scrollTop}px)`;
        }}
      />
    </div>
  );
}
