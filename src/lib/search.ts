import type { EntrySummary } from "./schema";

/**
 * Describe-it search. A beginner types "a panel that slides in from the side";
 * we match the meaningful words against names, aliases, and `looksLike` phrases.
 * No dependencies, runs in the browser, deterministic (see scripts/test-search.ts).
 */

const STOPWORDS = new Set(
  "a an the that this those these with in on of to from for and or it its is are when i my me thing things something what where how there at by as be can you your one some".split(
    " ",
  ),
);

/** Very light stemming so "slides" matches "slide" and "lines" matches "line". */
function stem(word: string): string {
  return word.length > 3 && word.endsWith("s") && !word.endsWith("ss") ? word.slice(0, -1) : word;
}

export function tokenize(text: string, dropStopwords = false): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word && !(dropStopwords && STOPWORDS.has(word)))
    .map(stem);
}

/** 1 = same word, 0.6 = one is the start of the other (min 3 letters), 0 = no match. */
function matchQuality(queryToken: string, docToken: string): number {
  if (queryToken === docToken) return 1;
  if (
    queryToken.length >= 3 &&
    docToken.length >= 3 &&
    (docToken.startsWith(queryToken) || queryToken.startsWith(docToken))
  ) {
    return 0.6;
  }
  return 0;
}

// Keep plausible alternatives while dropping incidental word matches.
const MIN_RELATIVE_SCORE = 0.6;

type Field = { weight: number; phrases: string[]; tokens: string[] };

function fieldsOf(entry: EntrySummary): Field[] {
  const make = (weight: number, phrases: string[]): Field => ({
    weight,
    phrases: phrases.map((phrase) => phrase.toLowerCase()),
    tokens: phrases.flatMap((phrase) => tokenize(phrase)),
  });
  return [
    make(6, [entry.name]),
    make(5, entry.aliases),
    make(4, entry.looksLike),
    make(2, entry.tags),
    make(1, [entry.definition, ...entry.whenToUse]),
  ];
}

function scoreEntry(entry: EntrySummary, phrasePattern: RegExp | null, queryTokens: string[]): number {
  const fields = fieldsOf(entry);
  let score = 0;

  for (const queryToken of queryTokens) {
    let best = 0;
    for (const field of fields) {
      for (const docToken of field.tokens) {
        const quality = matchQuality(queryToken, docToken);
        if (quality > 0) best = Math.max(best, field.weight * quality);
      }
    }
    score += best;
  }

  // Bonus for a whole phrase, not a substring inside a word ("form" in "information").
  if (phrasePattern && fields.some((field) => field.phrases.some((phrase) => phrasePattern.test(phrase)))) {
    score += 10;
  }

  return score;
}

/** Best matches and close alternatives first. Empty queries preserve the original entries and order. */
export function search(entries: EntrySummary[], query: string): EntrySummary[] {
  const rawQuery = query.toLowerCase().trim().replace(/\s+/g, " ");
  if (!rawQuery) return entries;

  const queryTokens = tokenize(rawQuery, true);
  if (queryTokens.length === 0) return [];

  // Escape punctuation before building a literal phrase match with token boundaries.
  const escapedQuery = rawQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const phrasePattern = rawQuery.length >= 3 ? new RegExp(`(^|[^a-z0-9])${escapedQuery}($|[^a-z0-9])`) : null;
  const ranked = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, phrasePattern, queryTokens) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));

  const bestScore = ranked[0]?.score;
  if (bestScore === undefined) return [];

  return ranked
    .filter((result) => result.score >= bestScore * MIN_RELATIVE_SCORE)
    .map((result) => result.entry);
}
