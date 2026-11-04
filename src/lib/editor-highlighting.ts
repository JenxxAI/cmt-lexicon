import type { SampleLanguage } from "./sample-source";

// This layer only paints text. The native textarea owns editing and selection.
const html =
  /(?<comment><!--[\s\S]*?(?:-->|$))|(?<tag><\/?[\w:-]+|\/?>)|(?<attribute>(?<![\w:-])[\w:-]+(?=\s*=))|(?<string>"[^"]*(?:"|$)|'[^']*(?:'|$))/g;
const css =
  /(?<comment>\/\*[\s\S]*?(?:\*\/|$))|(?<string>"(?:\\.|[^"\\])*(?:"|$)|'(?:\\.|[^'\\])*(?:'|$))|(?<number>#[\da-f]{3,8}\b|\b\d+(?:\.\d+)?(?:[a-z]+|%)?)|(?<attribute>(?<![-\w])[-\w]+(?=\s*:))|(?<keyword>@[\w-]+)|(?<call>(?<![\w-])[\w-]+(?=\())|(?<tag>[.#][\w-]+|\b[a-z][\w-]*(?=\s*\{))/gi;
const js =
  /(?<comment>\/\*[\s\S]*?(?:\*\/|$)|\/\/[^\n]*)|(?<string>"(?:\\.|[^"\\\n])*(?:"|(?=\n|$))|'(?:\\.|[^'\\\n])*(?:'|(?=\n|$))|`(?:\\[\s\S]|[^`\\])*(?:`|$))|(?<keyword>\b(?:async|await|break|case|catch|class|const|continue|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|switch|this|throw|try|typeof|var|while|yield)\b)|(?<number>\b(?:true|false|null|undefined|\d+(?:\.\d+)?)\b)|(?<call>(?<![$\w])[$\w]+(?=\s*\())|(?<attribute>\b(?:document|window|console)\b)/g;

export function codeTokens(source: string, language: SampleLanguage) {
  const parts: { text: string; kind?: string }[] = [];
  let offset = 0;
  for (const match of source.matchAll({ html, css, js }[language])) {
    if (match.index > offset)
      parts.push({ text: source.slice(offset, match.index) });
    parts.push({
      text: match[0],
      kind: Object.keys(match.groups!).find(
        (key) => match.groups![key] !== undefined,
      ),
    });
    offset = match.index + match[0].length;
  }
  if (offset < source.length) parts.push({ text: source.slice(offset) });
  return parts;
}
