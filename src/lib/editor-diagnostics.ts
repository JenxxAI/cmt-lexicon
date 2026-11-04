import { formatSampleCode } from "./format-sample";
import type { SampleLanguage } from "./sample-source";

export type EditorProblem = { line: number; column: number; message: string };
export async function checkSyntax(
  value: string,
  language: SampleLanguage,
): Promise<EditorProblem | null> {
  try {
    // Parse using the same grammar as Format with Prettier. Discard its formatted output.
    await formatSampleCode(value, language);
    return null;
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    const start = (
      error as Error & { loc?: { start?: { line: number; column: number } } }
    ).loc?.start;
    if (!start) throw error;
    return {
      line: start.line,
      column: start.column,
      message: error.message.split("\n")[0].replace(/\s*\(\d+:\d+\)$/, ""),
    };
  }
}
