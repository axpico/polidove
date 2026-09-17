import assert from "node:assert";
import { searchLessons, normalize, matchRanges, mergeRanges } from "./search.ts";
import type { Lesson } from "./lessons.ts";

const lessons: Lesson[] = [
  {
    idrichiesta: 1,
    course: "REAL AND FUNCTIONAL ANALYSIS",
    code: 95958,
    professors: ["VERZINI GIANMARIA"],
    campusName: "Leonardo",
    buildingName: "B2",
    buildingAddress: "Via B2 1",
    roomName: "1.1",
    date: "20260917",
    inizio: "10:15",
    fine: "13:15",
  },
  {
    idrichiesta: 2,
    course: "BASI DI DATI",
    code: 12345,
    professors: ["DE PONTI NICOLO"],
    campusName: "Leonardo",
    buildingName: "B3",
    buildingAddress: "Via B3 1",
    roomName: "2.2",
    date: "20260917",
    inizio: "14:15",
    fine: "16:15",
  },
  {
    idrichiesta: 3,
    course: "BASI DI DATI E CONOSCENZA",
    code: 67890,
    professors: ["ROSSI MARIO"],
    campusName: "Leonardo",
    buildingName: "B4",
    buildingAddress: "Via B4 1",
    roomName: "3.3",
    date: "20260917",
    inizio: "09:15",
    fine: "11:15",
  },
];

assert.strictEqual(normalize("Perù"), "peru", "should strip diacritics and lowercase");
assert.strictEqual(searchLessons(lessons, "f").length, 0, "below min query length should return nothing");
assert.strictEqual(searchLessons(lessons, "verzini").length, 1, "should match by professor");
assert.strictEqual(searchLessons(lessons, "95958").length, 1, "should match by course code");
assert.strictEqual(searchLessons(lessons, "ponti").length, 1, "should match professor substring");
assert.strictEqual(searchLessons(lessons, "2.2")[0]?.course, "BASI DI DATI", "should match by room number");
assert.strictEqual(searchLessons(lessons, "b3")[0]?.course, "BASI DI DATI", "should match by building name");
assert.strictEqual(searchLessons(lessons, "zzz").length, 0, "should not match unrelated query");

// multi-word query: every token must match somewhere
assert.strictEqual(searchLessons(lessons, "basi dati").length, 2, "multi-word query matches both BASI DI DATI courses");
assert.strictEqual(searchLessons(lessons, "basi dati conoscenza").length, 1, "extra token narrows to the exact course");

// ranking: whole-word match on "basi" for both, but exact course "BASI DI DATI" ranks before
// "BASI DI DATI E CONOSCENZA" since the query has no extra unmatched tokens to worsen it — same score expected,
// so just assert both are present and order is stable (word-match beats prefix/substring for a single token query).
const basiResults = searchLessons(lessons, "basi");
assert.strictEqual(basiResults.length, 2);

// rank professor last-name prefix ("ross") above unrelated matches
const rossResults = searchLessons(lessons, "ross");
assert.strictEqual(rossResults.length, 1);
assert.strictEqual(rossResults[0].professors[0], "ROSSI MARIO");

// matchRanges / mergeRanges for highlighting
assert.deepStrictEqual(matchRanges("BASI DI DATI", "basi"), [[0, 4]]);
assert.deepStrictEqual(matchRanges("VERZINI GIANMARIA", "verzini gian"), [
  [0, 7],
  [8, 12],
]);
assert.deepStrictEqual(
  mergeRanges([
    [0, 4],
    [3, 6],
    [10, 12],
  ]),
  [
    [0, 6],
    [10, 12],
  ],
  "overlapping ranges should merge",
);
assert.deepStrictEqual(mergeRanges([]), []);

console.log("search.selfcheck: OK");
