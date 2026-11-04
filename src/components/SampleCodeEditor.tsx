"use client";

import { useMemo, useRef } from "react";
import type { SampleLanguage } from "@/lib/sample-source";
import { codeTokens } from "@/lib/editor-highlighting";
import styles from "./SampleCodeEditor.module.css";

export function SampleCodeEditor({
  value,
  language,
  onChange,
  onBlur,
  onCursor,
  errorLine,
  problemId,
}: {
  errorLine?: number;
  problemId?: string;
  value: string;
  language: SampleLanguage;
  onChange: (value: string) => void;
  onBlur: (nextTarget: EventTarget | null) => void;
  onCursor: (line: number, column: number) => void;
}) {
  const code = useRef<HTMLPreElement>(null);
  const numbers = useRef<HTMLPreElement>(null);
  const tokens = useMemo(
    () =>
      codeTokens(value, language).map((token, index) =>
        token.kind ? (
          <span key={index} className={styles[token.kind]}>
            {token.text}
          </span>
        ) : (
          token.text
        ),
      ),
    [value, language],
  );
  return (
    <div className={styles.editor}>
      <pre ref={code} aria-hidden="true" className={styles.code}>
        {tokens}
        {"\n"}
      </pre>
      <div aria-hidden="true" className={styles.gutter}>
        <pre ref={numbers} className={styles.numbers}>
          {Array.from({ length: value.split("\n").length }, (_, index) => (
            <span
              key={index}
              className={errorLine === index + 1 ? styles.errorLine : undefined}
            >
              {index + 1}
              {"\n"}
            </span>
          ))}
        </pre>
      </div>
      <textarea
        aria-label={`${{ html: "HTML", css: "CSS", js: "JavaScript" }[language]} code`}
        aria-invalid={errorLine ? true : undefined}
        aria-describedby={
          problemId ? `editor-help ${problemId}` : "editor-help"
        }
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
