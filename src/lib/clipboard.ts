/**
 * Copy text and report whether it really reached the clipboard. Never throws, so
 * callers can show success only on `true` and failure feedback on `false`.
 * Pure browser APIs, no dependencies, client-safe (tested in scripts/test-clipboard.ts).
 */

/** Legacy path for insecure contexts and older browsers. `execCommand` returns false on failure. */
function legacyCopy(text: string): boolean {
  if (typeof document === "undefined" || typeof document.execCommand !== "function" || !document.body) {
    return false;
  }
  // select() moves focus into the temporary field; hand it back so keyboard users keep their place.
  const previous = document.activeElement as HTMLElement | null;
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.setAttribute("aria-hidden", "true");
  area.style.position = "fixed";
  area.style.top = "0";
  area.style.left = "0";
  area.style.opacity = "0";
  try {
    document.body.appendChild(area);
    area.select();
    return document.execCommand("copy") === true;
  } catch {
    return false;
  } finally {
    area.remove();
    previous?.focus?.();
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && typeof navigator.clipboard?.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Rejected (permission, missing focus, insecure context): fall through to the legacy path.
  }
  return legacyCopy(text);
}
