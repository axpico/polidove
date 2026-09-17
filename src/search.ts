// Fuzzy, accent-insensitive search over lessons by course, course code, or professor,
// plus the range math needed to highlight matches in the results list.
import type { Lesson } from "./lessons.ts";

const COMBINING_MARKS = /[\u0300-\u036f]/g;
const MIN_QUERY_LENGTH = 2;
const MAX_RESULTS = 20;

// Diacritic-insensitive, case-insensitive form used for both indexing and querying
// (NFD splits accented letters into base + combining mark, which we then strip).
export function normalize(text: string): string {
  return text.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase().trim();
}

function tokenize(query: string): string[] {
  return normalize(query)
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function haystackWords(lesson: Lesson): string[] {
  return [
    ...normalize(lesson.course).split(/\s+/),
    normalize(String(lesson.code)),
    ...lesson.professors.flatMap((p) => normalize(p).split(/\s+/)),
    ...normalize(lesson.roomName).split(/\s+/),
    ...normalize(lesson.buildingName).split(/\s+/),
  ];
}

// Lower is better: 0 = whole word match, 1 = word-prefix match, 2 = loose substring match.
function tokenScore(words: string[], haystack: string, token: string): number | null {
  if (words.includes(token)) return 0;
  if (words.some((w) => w.startsWith(token))) return 1;
  if (haystack.includes(token)) return 2;
  return null;
}

// null means at least one query token matched nothing in this lesson (excluded from results).
function matchScore(lesson: Lesson, tokens: string[]): number | null {
  const words = haystackWords(lesson);
  const haystack = words.join(" ");
  let score = 0;
  for (const token of tokens) {
    const tScore = tokenScore(words, haystack, token);
    if (tScore === null) return null;
    score += tScore;
  }
  return score;
}

export function searchLessons(lessons: Lesson[], query: string): Lesson[] {
  const tokens = tokenize(query);
  if (tokens.join("").length < MIN_QUERY_LENGTH) return [];
  return lessons
    .map((lesson) => ({ lesson, score: matchScore(lesson, tokens) }))
    .filter((entry): entry is { lesson: Lesson; score: number } => entry.score !== null)
    .sort((a, b) => a.score - b.score)
    .slice(0, MAX_RESULTS)
    .map((entry) => entry.lesson);
}

export type Range = [number, number];

// [start, end) character ranges (into the ORIGINAL text) covering each matched token,
// used to wrap matches in <mark> for highlighting.
// Approximate: normalize() preserves character count for the accents this API produces
// (single combining mark per base letter), so indices map back onto the original text.
export function matchRanges(text: string, query: string): Range[] {
  const norm = normalize(text);
  const ranges: Range[] = [];
  for (const token of tokenize(query)) {
    const idx = norm.indexOf(token);
    if (idx !== -1) ranges.push([idx, idx + token.length]);
  }
  return ranges;
}

export function mergeRanges(ranges: Range[]): Range[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);
  const merged: Range[] = [sorted[0]];
  for (const [start, end] of sorted.slice(1)) {
    const last = merged[merged.length - 1];
    if (start <= last[1]) {
      last[1] = Math.max(last[1], end);
    } else {
      merged.push([start, end]);
    }
  }
  return merged;
}
