import { lookupRepository } from "@/lib/server/github-repository";

const escapeAttribute = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
/** Isolated wrapper: the application retains its self-only frame policy. */
export async function GET(request: Request) {
  let website: string | null = null;
  try {
    website = (
      await lookupRepository(
        new URL(request.url).searchParams.get("repository") ?? "",
      )
    ).website;
  } catch {
    /* A preview must never break the showcase. */
  }
  const content = website
    ? `<iframe title="Repository landing page" src="${escapeAttribute(website)}" sandbox="allow-scripts" referrerpolicy="no-referrer" allow="camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'" style="border:0;width:100%;height:100vh;display:block"></iframe>`
    : "<p>No embedded preview is available. Open the repository to find its website.</p>";
  return new Response(
    `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Repository landing page</title><body style="margin:0">${content}</body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "no-referrer",
        "Permissions-Policy":
          "camera=(), microphone=(), geolocation=(), payment=()",
        "Content-Security-Policy": `sandbox allow-scripts; default-src 'none'; style-src 'unsafe-inline'; frame-src ${website ? new URL(website).origin : "'none'"}; frame-ancestors 'self'; base-uri 'none'; form-action 'none'`,
      },
    },
  );
}
