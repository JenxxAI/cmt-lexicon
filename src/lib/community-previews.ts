/** Preview images for community projects. Pure helpers: safe to import anywhere and unit-tested. */
export const PREVIEW_BUCKET = "community-previews";
export const PREVIEW_LIMITS = {
  /** Images per project; the first one is the cover. */
  maxImages: 4,
  /** Longest edge after the browser downsizes an image. */
  maxEdge: 1280,
  /** Bytes per image after downsizing (the bucket allows 600 KB). */
  maxBytes: 500_000,
  /** Largest original the browser will try to decode. */
  maxInputBytes: 12_000_000,
} as const;
/** SVG and GIF are excluded on purpose: SVG can carry script, and re-encoding strips metadata. */
export const PREVIEW_MIME = ["image/webp", "image/png", "image/jpeg"] as const;
const EXTENSIONS: Record<string, string> = {
  "image/webp": "webp",
  "image/png": "png",
  "image/jpeg": "jpg",
};
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const PATH = new RegExp(`^${UUID}/${UUID}\\.(webp|png|jpg)$`);

export function isPreviewMime(type: string) {
  return (PREVIEW_MIME as readonly string[]).includes(type);
}
/** `<owner uuid>/<image uuid>.<ext>`: the owner folder is what the storage policies check. */
export function previewPath(ownerId: string, imageId: string, mime: string) {
  const extension = EXTENSIONS[mime];
  if (!extension) throw new Error("Use a WebP, PNG or JPEG image.");
  const path = `${ownerId.toLowerCase()}/${imageId.toLowerCase()}.${extension}`;
  if (!PATH.test(path)) throw new Error("Invalid preview image path.");
  return path;
}
export function isPreviewPath(value: unknown): value is string {
  return typeof value === "string" && PATH.test(value);
}
/** Scale down to fit `max` on the longest edge; never upscale. Whole pixels, at least 1. */
export function fitWithin(width: number, height: number, max: number) {
  const scale = Math.min(1, max / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
export function previewAlt(title: string, index: number, total: number) {
  const name = title.trim() || "Project";
  return total > 1
    ? `${name} preview, image ${index + 1} of ${total}`
    : `${name} preview`;
}
export function previewFileError(file: {
  type: string;
  size: number;
}): string | null {
  if (!isPreviewMime(file.type))
    return "Preview images must be PNG, JPEG or WebP.";
  if (file.size > PREVIEW_LIMITS.maxInputBytes)
    return "That image is larger than 12 MB. Choose a smaller screenshot.";
  return null;
}
