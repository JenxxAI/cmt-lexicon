import { useSyncExternalStore } from "react";
import { DEFAULT_PALETTE, normalizeHex, type Palette } from "./color";

/** One palette shared by every playground, saved in this browser only (a per-viewer convenience). */
const KEY = "ui-lexicon:palette:v1";

let current: Palette = DEFAULT_PALETTE;
let loaded = false;
const listeners = new Set<() => void>();

function parse(raw: string | null): Palette {
  try {
    const value = JSON.parse(raw ?? "");
    const c1 = normalizeHex(value.c1);
    const c2 = normalizeHex(value.c2);
    if (!c1 || !c2) return DEFAULT_PALETTE;
    const angle = Number(value.angle);
    return {
      mode: value.mode === "solid" ? "solid" : "gradient",
      c1,
      c2,
      angle: Number.isFinite(angle) ? Math.min(360, Math.max(0, angle)) : DEFAULT_PALETTE.angle,
      all: value.all === true,
    };
  } catch {
    return DEFAULT_PALETTE;
  }
}

function load() {
  if (loaded) return;
  loaded = true;
  try {
    current = parse(window.localStorage.getItem(KEY));
  } catch {
    /* storage blocked: keep the default */
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== KEY) return;
    current = parse(event.newValue);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function setPalette(patch: Partial<Palette>) {
  load();
  current = { ...current, ...patch };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* storage blocked: the palette still works until the page closes */
  }
  listeners.forEach((listener) => listener());
}

export function usePalette(): Palette {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return current;
    },
    () => DEFAULT_PALETTE,
  );
}
