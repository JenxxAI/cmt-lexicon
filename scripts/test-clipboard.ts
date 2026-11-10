import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { copyText } from "../src/lib/clipboard";

type Globals = { navigator?: unknown; document?: unknown };
const globals = globalThis as unknown as Globals;
const originals = {
  navigator: Object.getOwnPropertyDescriptor(globalThis, "navigator"),
  document: Object.getOwnPropertyDescriptor(globalThis, "document"),
};

function setGlobal(name: "navigator" | "document", value: unknown) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true });
}

function restoreGlobals() {
  for (const name of ["navigator", "document"] as const) {
    const original = originals[name];
    if (original) Object.defineProperty(globalThis, name, original);
    else delete globals[name];
  }
}

type DomOptions = { execCommand?: (command: string) => boolean };

/** A minimal DOM: just enough surface for the legacy textarea fallback. */
function fakeDom(options: DomOptions = {}) {
  const log = { created: 0, appended: 0, selected: 0, removed: 0, refocused: 0, commands: [] as string[], value: "" };
  const focusTarget = { focus: () => void log.refocused++ };
  const document: Record<string, unknown> = {
    activeElement: focusTarget,
    body: { appendChild: () => void log.appended++ },
    createElement: () => {
      log.created++;
      const attributes: Record<string, string> = {};
      return {
        style: {},
        set value(next: string) { log.value = next; },
        setAttribute: (key: string, val: string) => void (attributes[key] = val),
        select: () => void log.selected++,
        remove: () => void log.removed++,
      };
    },
  };
  if (options.execCommand) {
    document.execCommand = (command: string) => {
      log.commands.push(command);
      return options.execCommand!(command);
    };
  }
  setGlobal("document", document);
  return log;
}

function fakeClipboard(writeText?: (text: string) => Promise<void> | void) {
  const written: string[] = [];
  setGlobal("navigator", writeText ? { clipboard: { writeText: async (text: string) => { written.push(text); await writeText(text); } } } : {});
  return written;
}

async function main() {
  // 1. Clipboard API works: success is reported and the legacy path is never touched.
  {
    const dom = fakeDom({ execCommand: () => true });
    const written = fakeClipboard(() => undefined);
    assert.equal(await copyText("hello"), true);
    assert.deepEqual(written, ["hello"]);
    assert.equal(dom.created, 0, "no textarea when the Clipboard API works");
  }

  // 2. Clipboard API rejects (blocked, no focus, insecure context): the fallback copies for real.
  {
    const dom = fakeDom({ execCommand: () => true });
    fakeClipboard(() => Promise.reject(new DOMException("blocked", "NotAllowedError")));
    assert.equal(await copyText("fallback text"), true, "a working fallback counts as success");
    assert.deepEqual(dom.commands, ["copy"]);
    assert.equal(dom.value, "fallback text");
    assert.equal(dom.selected, 1);
    assert.equal(dom.removed, 1, "the temporary textarea is removed");
    assert.equal(dom.refocused, 1, "focus returns to the element the person was on");
  }

  // 3. Clipboard API rejects AND the legacy command reports failure: never claim success.
  {
    const dom = fakeDom({ execCommand: () => false });
    fakeClipboard(() => Promise.reject(new Error("denied")));
    assert.equal(await copyText("nope"), false);
    assert.equal(dom.removed, 1, "cleanup still runs after a failed copy");
    assert.equal(dom.refocused, 1);
  }

  // 4. Clipboard API unavailable (insecure context) and the legacy command throws.
  {
    const dom = fakeDom({ execCommand: () => { throw new Error("not allowed"); } });
    fakeClipboard();
    assert.equal(await copyText("throws"), false, "a throwing fallback resolves false, not a rejection");
    assert.equal(dom.removed, 1);
  }

  // 5. writeText throws synchronously instead of returning a rejected promise.
  {
    fakeDom({ execCommand: () => true });
    setGlobal("navigator", { clipboard: { writeText: () => { throw new TypeError("sync failure"); } } });
    assert.equal(await copyText("sync"), true, "a synchronous throw still reaches the fallback");
  }

  // 6. No usable clipboard of any kind (execCommand missing, no Clipboard API).
  {
    fakeDom();
    fakeClipboard();
    assert.equal(await copyText("nothing works"), false);
  }

  // 7. Server rendering or a stripped-down runtime: no navigator and no document.
  {
    delete globals.navigator;
    delete globals.document;
    Object.defineProperty(globalThis, "navigator", { value: undefined, configurable: true, writable: true });
    assert.equal(await copyText("ssr"), false, "no DOM resolves false without throwing");
  }

  // 8. The Clipboard API wins even when execCommand would also succeed, and each call is independent.
  {
    const dom = fakeDom({ execCommand: () => true });
    const written = fakeClipboard(() => undefined);
    assert.equal(await copyText("one"), true);
    assert.equal(await copyText("two"), true);
    assert.deepEqual(written, ["one", "two"]);
    assert.equal(dom.created, 0);
  }

  restoreGlobals();

  // Wiring guard: both copy surfaces use the shared helper and expose an accessible failure message.
  const copyButton = readFileSync("src/components/CopyButton.tsx", "utf8");
  const colorLab = readFileSync("src/components/playground/ColorLab.tsx", "utf8");
  for (const [name, source] of [["CopyButton", copyButton], ["ColorLab", colorLab]] as const) {
    assert.ok(!source.includes("navigator.clipboard"), `${name} must go through copyText, not the raw Clipboard API`);
    assert.ok(!source.includes("execCommand"), `${name} must not call execCommand directly`);
    assert.match(source, /role="alert"/, `${name} announces a failed copy`);
    assert.match(source, /COPY_FAILED_HINT/, `${name} uses the shared failure message`);
  }

  console.log("Clipboard checks passed: API success, rejected API, fallback success and failure, no DOM, wiring.");
}

main().catch((error) => {
  restoreGlobals();
  console.error(error);
  process.exit(1);
});
