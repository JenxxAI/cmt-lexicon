import type { SampleLanguage, SampleSource } from "./sample-source";

/** Loaded only when an editor requests formatting; no CDN or server round trip. */
export async function formatSampleCode(
  code: string,
  language: SampleLanguage,
): Promise<string> {
  if (code.length > 100_000)
    throw new Error(
      "This sample is too large to format. Keep each file under 100,000 characters.",
    );
  const prettier = await import("prettier/standalone");
  const plugins =
    language === "js"
      ? await Promise.all([
          import("prettier/plugins/babel"),
          import("prettier/plugins/estree"),
        ])
      : language === "css"
        ? [await import("prettier/plugins/postcss")]
        : [await import("prettier/plugins/html")];
  return prettier.format(code, {
    parser: language === "js" ? "babel" : language === "css" ? "css" : "html",
    plugins,
    tabWidth: 2,
    useTabs: false,
    printWidth: 80,
    semi: true,
    singleQuote: false,
    embeddedLanguageFormatting: "off",
    htmlWhitespaceSensitivity: "css",
  });
}

export async function formatSample(
  source: SampleSource,
): Promise<SampleSource> {
  const result = { ...source };
  // Attribute parse errors to a file and never partially replace the user's source.
  for (const key of ["html", "css", "js"] as const) {
    try {
      result[key] = await formatSampleCode(source[key], key);
    } catch (error) {
      throw new Error(
        `${{ html: "index.html", css: "styles.css", js: "script.js" }[key]}: ${error instanceof Error ? error.message : "Formatting failed"}`,
      );
    }
  }
  return result;
}
