export const MAX_SCREENSHOT_BYTES = 3 * 1024 * 1024;
export const MAX_REQUEST_BYTES = MAX_SCREENSHOT_BYTES + 32 * 1024;
export type Feedback = {
  kind: string;
  message: string;
  email: string;
  page: string;
};
export function validateFeedback(value: Feedback): string | null {
  if (!["bug", "feedback", "idea"].includes(value.kind))
    return "Choose a feedback type.";
  if (value.message.trim().length < 10 || value.message.length > 4000)
    return "Write between 10 and 4000 characters.";
  if (
    value.email &&
    (value.email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))
  )
    return "Enter a valid email address or leave it blank.";
  if (value.page.length > 500 || !/^\/(?!\/)[^?#\r\n\\]*$/.test(value.page))
    return "Invalid page path.";
  return null;
}
export function screenshotType(bytes: Uint8Array): string | null {
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v))
    return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  if (
    new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" &&
    new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}
