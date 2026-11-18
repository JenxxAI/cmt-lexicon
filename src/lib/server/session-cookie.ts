import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/** Authenticated encryption; separate purposes prevent swapping OAuth/session cookies. */
export function sealCookie(
  value: unknown,
  key: Buffer,
  purpose: string,
): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from(purpose));
  const data = Buffer.concat([
    cipher.update(JSON.stringify(value), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64url");
}

export function openCookie<T>(
  value: string | undefined,
  key: Buffer,
  purpose: string,
): T | null {
  try {
    if (!value || value.length > 3800) return null;
    const bytes = Buffer.from(value, "base64url");
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      bytes.subarray(0, 12),
    );
    decipher.setAAD(Buffer.from(purpose));
    decipher.setAuthTag(bytes.subarray(12, 28));
    return JSON.parse(
      Buffer.concat([
        decipher.update(bytes.subarray(28)),
        decipher.final(),
      ]).toString("utf8"),
    ) as T;
  } catch {
    return null;
  }
}

export function cookieHeader(
  name: string,
  value: string,
  age: number,
  secure: boolean,
) {
  if (value.length > 3800) throw new Error("Session exceeds cookie size limit");
  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(age))}${secure ? "; Secure" : ""}`;
}

export function sameOriginMutation(request: Request, origin: string): boolean {
  return (
    request.headers.get("origin") === origin &&
    request.headers.get("sec-fetch-site") !== "cross-site" &&
    request.headers.get("content-type")?.split(";")[0].trim() ===
      "application/json"
  );
}
