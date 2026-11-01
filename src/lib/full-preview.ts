export const PREVIEW_PREFIX = "ui-lexicon-preview:";
export const PREVIEW_TTL = 15 * 60 * 1000;
export type PreviewSnapshot = {
  title: string;
  document: string;
  returnTo: string;
  createdAt: number;
};
export function parsePreview(
  raw: string | null,
  now = Date.now(),
): PreviewSnapshot | null {
  if (!raw || raw.length > 2_000_000) return null;
  try {
    const value = JSON.parse(raw);
    if (
      typeof value.title !== "string" ||
      value.title.length > 160 ||
      typeof value.document !== "string" ||
      typeof value.returnTo !== "string" ||
      !/^\/(websites|community)\//.test(value.returnTo) ||
      /[\\\r\n]/.test(value.returnTo) ||
      !Number.isFinite(value.createdAt) ||
      value.createdAt > now ||
      now - value.createdAt >= PREVIEW_TTL
    )
      return null;
    return value;
  } catch {
    return null;
  }
}
export function storePreview(
  storage: Storage,
  snapshot: PreviewSnapshot,
  id: string,
): string {
  const raw = JSON.stringify(snapshot);
  if (!parsePreview(raw))
    throw new Error("This preview is too large to open in a new tab.");
  const existing: { key: string; createdAt: number }[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key?.startsWith(PREVIEW_PREFIX))
      existing.push({
        key,
        createdAt: parsePreview(storage.getItem(key))?.createdAt ?? 0,
      });
  }
  existing.sort((a, b) => b.createdAt - a.createdAt);
  existing.forEach((item, index) => {
    if (!item.createdAt || index >= 4) storage.removeItem(item.key);
  });
  storage.setItem(PREVIEW_PREFIX + id, raw);
  return `/preview/?id=${id}`;
}
