export type SampleSource = { html: string; css: string; js: string };
export type SampleLanguage = keyof SampleSource;

export function splitSample(document: string): SampleSource {
  return {
    html: (document.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] ?? "")
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
      .trim(),
    css: (document.match(/<style[^>]*>([\s\S]*?)<\/style>/i)?.[1] ?? "").trim(),
    js: (
      document.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i)?.[1] ?? ""
    ).trim(),
  };
}

export function assembleSample(original: string, source: SampleSource): string {
  const head =
    original
      .match(/<head>([\s\S]*?)<\/head>/i)?.[1]
      .replace(/<style[^>]*>[\s\S]*?<\/style>/i, "") ?? "";
  return `<!doctype html>\n<html lang="en">\n<head>${head}\n<style>\n${source.css}\n</style>\n</head>\n<body>\n${source.html}\n<script>\n${source.js}\n</script>\n</body>\n</html>`;
}
