import type { AssetIconId } from "@/lib/assets";

/** Original, representative symbols; these are not the libraries' exact artwork. */
export function AssetGlyph({ id }: { id: AssetIconId }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="size-6 shrink-0 text-accent">
      {id === "menu" && <path d="M4 6h16M4 12h16M4 18h16" />}
      {id === "search" && <><circle cx="10" cy="10" r="6" /><path d="m15 15 5 5" /></>}
      {id === "close" && <path d="m5 5 14 14M19 5 5 19" />}
      {id === "settings" && <><path d="m9 3 1-2h4l1 2 2 1 2 0 2 3-1 2v3l1 2-2 3-2 0-2 1-1 3h-4l-1-3-2-1H5l-2-3 1-2V9L3 7l2-3h2Z" /><circle cx="12" cy="11" r="3" /></>}
      {id === "check" && <path d="m4 12 5 5L20 6" />}
      {id === "delete" && <><path d="M4 6h16M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7" /></>}
    </svg>
  );
}
