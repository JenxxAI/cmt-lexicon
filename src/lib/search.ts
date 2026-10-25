import type { EntrySummary, WebsiteTypeSummary } from "./schema";

export type SearchEntry = EntrySummary | WebsiteTypeSummary;
export function isWebsiteType(entry: SearchEntry): entry is WebsiteTypeSummary {
  return "kind" in entry && entry.kind === "website";
}

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

// Query-only equivalents. Each group has a hub and bidirectional alternatives.
// Do not expand transitively: "mouse over" means hover, not a text-entry cursor.
// Alternatives share the original phrase’s token budget and never add extra votes.
const SYNONYM_WEIGHT = 0.8;
const SYNONYMS = [
  ["hover", "mouse over", "mouseover", "cursor", "mouse on top"],
  ["popup", "pop up"],
  ["dropdown", "drop down"],
  ["navbar", "nav bar"],
  ["burger", "hamburger"],
].map((group) => group.map((phrase) => tokenize(phrase, true)));

type QueryTerm = { direct: string[]; alternatives: string[][] };

function queryTerms(tokens: string[]): QueryTerm[] {
  const terms: QueryTerm[] = [];
  for (let index = 0; index < tokens.length;) {
    const match = SYNONYMS.flatMap((group) => group.map((phrase) => ({ group, phrase })))
      .filter(({ phrase }) => phrase.every((token, offset) => tokens[index + offset] === token))
      .sort((a, b) => b.phrase.length - a.phrase.length)[0];
    if (match) {
      terms.push({ direct: match.phrase, alternatives: match.phrase === match.group[0] ? match.group.slice(1) : [match.group[0]] });
      index += match.phrase.length;
    } else {
      terms.push({ direct: [tokens[index]], alternatives: [] });
      index += 1;
    }
  }
  return terms;
}

type Field = { weight: number; phrases: string[]; tokens: string[] };

function fieldsOf(entry: SearchEntry): Field[] {
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
    make(1, [entry.definition, ...(isWebsiteType(entry) ? [entry.goal] : entry.whenToUse)]),
  ];
}

function scoreEntry(entry: SearchEntry, phrasePattern: RegExp | null, terms: QueryTerm[]): number {
  const fields = fieldsOf(entry);
  let score = 0;

  function tokenScore(token: string): number {
    let best = 0;
    for (const field of fields) {
      for (const docToken of field.tokens) best = Math.max(best, field.weight * matchQuality(token, docToken));
    }
    return best;
  }

  for (const term of terms) {
    let best = term.direct.reduce((sum, token) => sum + tokenScore(token), 0);
    for (const alternative of term.alternatives) {
      for (const field of fields) {
        // Require adjacent words in a single phrase; never join unrelated fields.
        const matches = field.phrases.some((phrase) => {
          const tokens = tokenize(phrase, true);
          return tokens.some((_, index) => alternative.every((token, offset) => tokens[index + offset] === token));
        });
        if (matches) best = Math.max(best, field.weight * SYNONYM_WEIGHT * term.direct.length);
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
export function search<T extends SearchEntry>(entries: T[], query: string): T[] {
  const rawQuery = query.toLowerCase().trim().replace(/\s+/g, " ");
  if (!rawQuery) return entries;

  const queryTokens = tokenize(rawQuery, true);
  if (queryTokens.length === 0) return [];

  // Escape punctuation before building a literal phrase match with token boundaries.
  const escapedQuery = rawQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const phrasePattern = rawQuery.length >= 3 ? new RegExp(`(^|[^a-z0-9])${escapedQuery}($|[^a-z0-9])`) : null;
  const terms = queryTerms(queryTokens);
  const ranked = entries
    .map((entry) => ({ entry, score: scoreEntry(entry, phrasePattern, terms) }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.name.localeCompare(b.entry.name));

  const bestScore = ranked[0]?.score;
  if (bestScore === undefined) return [];

  // Website intent is explicit vocabulary or a complete curated beginner description.
  // Generic words shared by a blueprint and a component do not promote the website.
  const normalized = queryTokens.join(" ");
  const containsPhrase = (phrase: string) => {
    const words = tokenize(phrase, true).join(" ");
    return words.length > 0 && ` ${normalized} `.includes(` ${words} `);
  };
  const websiteIntent = entries.some(entry => isWebsiteType(entry) && (
    [entry.name, ...entry.aliases].some(containsPhrase) ||
    (queryTokens.length >= 3 && entry.looksLike.some(phrase => tokenize(phrase, true).join(" ") === normalized))
  ));

  return ranked
    .filter((result) => result.score >= bestScore * MIN_RELATIVE_SCORE)
    .sort((a, b) => {
      const aWebsite = isWebsiteType(a.entry), bWebsite = isWebsiteType(b.entry);
      if (aWebsite === bWebsite) return b.score - a.score || a.entry.name.localeCompare(b.entry.name);
      return aWebsite === websiteIntent ? -1 : 1;
    })
    .map((result) => result.entry);
}
