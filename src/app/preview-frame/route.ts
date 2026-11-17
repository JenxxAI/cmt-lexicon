// This document has an opaque origin even if its URL is opened directly.
// A one-use port delivers the source locally, without sending drafts to the server.
const bootstrap = `<!doctype html><meta charset="utf-8"><script>
if (window !== parent) {
  const channel = new MessageChannel();
  channel.port1.onmessage = ({data}) => {
    channel.port1.close();
    if (typeof data !== "string") return;
    document.open();
    document.write(data);
    document.close();
  };
  parent.postMessage("lexicon-preview-ready", new URL(location.href).origin, [channel.port2]);
}
</script>`;

export function GET() {
  return new Response(bootstrap, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        "sandbox allow-scripts allow-forms; default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data: blob:; font-src data:; connect-src 'none'; frame-ancestors 'self'; form-action 'none'; base-uri 'none'",
    },
  });
}
