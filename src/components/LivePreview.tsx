"use client";

import { useEffect, useId, useRef, useState } from "react";
import styles from "./LivePreview.module.css";

const button = "min-h-11 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface hover:bg-accent-deep";
const secondary = "min-h-11 rounded-lg border border-rule bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-paper";

export type LivePreviewId = "drawer" | "modal" | "popover" | "toast";

export function LivePreview({ id }: { id: LivePreviewId }) {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const panelId = useId();
  const descriptionId = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const isDialog = id === "drawer" || id === "modal";
  const label = id[0].toUpperCase() + id.slice(1);

  function close() {
    if (isDialog) dialog.current?.close();
    setOpen(false);
    trigger.current?.focus();
  }

  function show() {
    if (isDialog) dialog.current?.showModal();
    setOpen(true);
  }

  useEffect(() => {
    if (!open || id !== "popover") return;
    function outside(event: PointerEvent) {
      const target = event.target as Node;
      if (!popover.current?.contains(target) && !trigger.current?.contains(target)) {
        setOpen(false);
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open, id]);

  return (
    <section aria-label={`${label} interactive preview`} className="rounded-[18px] border border-rule bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-5 py-3">
        <h2 className="font-display text-lg font-semibold">Try it</h2>
        <span className="font-mono text-xs text-muted">{open ? "Open" : "Closed"}</span>
      </div>
      <div className="relative flex min-h-64 flex-col rounded-b-[18px] items-start gap-4 bg-stage p-5">
        <p className="text-sm text-body">
          {id === "drawer" && "Open a side panel without leaving this page."}
          {id === "modal" && "Open a dialog that pauses interaction with the page."}
          {id === "popover" && "Reveal extra information beside its button."}
          {id === "toast" && "Show a confirmation while keeping the page available."}
        </p>
        <div className="relative w-full">
          <button
            ref={trigger}
            type="button"
            className={button}
            onClick={() => open && id === "popover" ? close() : show()}
            aria-haspopup={isDialog ? "dialog" : undefined}
            aria-expanded={id === "popover" ? open : undefined}
            aria-controls={id === "popover" || isDialog ? panelId : undefined}
          >
            {id === "toast" ? "Show toast" : `${open && id === "popover" ? "Close" : "Open"} ${id}`}
          </button>
          {id === "popover" && (
            <div
              ref={popover}
              id={panelId}
              hidden={!open}
              className={`${styles.appear} absolute left-0 top-full z-10 mt-2 w-full max-w-72 rounded-xl border border-rule bg-surface p-4 shadow-lg`}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget) && event.relatedTarget !== trigger.current) setOpen(false);
              }}
            >
              <h3 className="font-display text-lg font-semibold">A little more detail</h3>
              <p className="mt-1 text-sm text-body">This panel stays close to the button. Click outside or press Escape to dismiss it.</p>
              <button type="button" className={`${secondary} mt-3`} onClick={close}>Close popover</button>
            </div>
          )}
        </div>
        {id === "toast" && (
          <div className="mt-auto w-full">
            <div role="status" aria-atomic="true">
              {open && <p className={`${styles.appear} rounded-xl border border-rule bg-surface p-4 text-sm text-body`}>Changes saved. Your work is up to date.</p>}
            </div>
            {open && <button type="button" className={`${secondary} mt-2`} onClick={close}>Dismiss toast</button>}
          </div>
        )}
        <p className="mt-auto text-xs text-muted">
          {isDialog ? "Close with the button, backdrop, or Escape." : id === "toast" ? "This demo stays visible until you dismiss it." : "The rest of the page remains interactive."}
        </p>
      </div>
      {isDialog && (
        <dialog
          ref={dialog}
          id={panelId}
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          className={`${styles.dialog} ${id === "drawer" ? styles.drawer : styles.modal} border border-rule bg-surface p-6 text-ink shadow-xl`}
          onPointerDown={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            backdropPress.current = event.target === event.currentTarget &&
              (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
          }}
          onClick={(event) => {
            const bounds = event.currentTarget.getBoundingClientRect();
            if (backdropPress.current && event.target === event.currentTarget &&
              (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) close();
            backdropPress.current = false;
          }}
          onClose={() => setOpen(false)}
        >
          <h3 id={titleId} className="font-display text-2xl font-semibold">{id === "drawer" ? "Your side panel" : "A moment of focus"}</h3>
          <p id={descriptionId} className="mt-3 text-body">
            {id === "drawer" ? "A drawer keeps extra details at the edge of the screen. Close it to return to the page." : "A modal asks for your attention before you continue. The page behind it is temporarily unavailable."}
          </p>
          <button type="button" autoFocus className={`${button} mt-6`} onClick={close}>Close {id}</button>
        </dialog>
      )}
    </section>
  );
}
