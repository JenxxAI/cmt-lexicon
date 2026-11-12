import {
  PREVIEW_LIMITS,
  fitWithin,
  isPreviewMime,
  previewFileError,
} from "./community-previews";

/**
 * Browser-only. Decodes a screenshot, scales it down to PREVIEW_LIMITS.maxEdge and re-encodes it
 * (WebP where supported). Re-encoding drops EXIF data such as GPS location before anything is
 * uploaded, and keeps every image small enough for the gallery.
 */
export async function prepareImage(file: File): Promise<Blob> {
  const invalid = previewFileError(file);
  if (invalid) throw new Error(invalid);
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`${file.name || "That file"} could not be read as an image.`);
  }
  try {
    const { width, height } = fitWithin(
      bitmap.width,
      bitmap.height,
      PREVIEW_LIMITS.maxEdge,
    );
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Image processing is not available in this browser.");
    context.drawImage(bitmap, 0, 0, width, height);
    for (const quality of [0.85, 0.7, 0.5]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality),
      );
      if (blob && isPreviewMime(blob.type) && blob.size <= PREVIEW_LIMITS.maxBytes)
        return blob;
    }
    throw new Error(
      `${file.name || "That image"} is too detailed to shrink under ${PREVIEW_LIMITS.maxBytes / 1000} KB. Crop it or use a simpler screenshot.`,
    );
  } finally {
    bitmap.close();
  }
}
