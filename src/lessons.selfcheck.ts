import assert from "node:assert";
import { flattenLessons } from "./lessons.ts";
import type { OccupationsResponse } from "./api.ts";

const sample: OccupationsResponse = {
  generated_at: "2026-09-17T13:00:00",
  date: "20260917",
  campuses: [
    {
      id: "MIA01",
      name: "Leonardo",
      buildings: [
        {
          name: "2",
          address: "Piazza Leonardo da Vinci 32",
          classrooms: [
            {
              id: 32,
              name: "2.0.1",
              occupancy: [
                {
                  inizio: "08:15",
                  fine: "10:15",
                  category: "COURSE",
                  course: "GAME THEORY",
                  code: 88976,
                  professors: ["VALENTE GIOVANNI"],
                  idrichiesta: 610086,
                },
                { inizio: "10:15", fine: "13:15" },
                {
                  inizio: "13:15",
                  fine: "15:15",
                  category: "EXAM",
                  course: "SOMETHING",
                  code: 1,
                  professors: ["X Y"],
                  idrichiesta: 2,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

const lessons = flattenLessons(sample);
assert.strictEqual(lessons.length, 1, "should keep only COURSE slots with full data");
assert.strictEqual(lessons[0].course, "GAME THEORY");
assert.strictEqual(lessons[0].roomName, "2.0.1");
assert.strictEqual(lessons[0].buildingName, "2");
assert.strictEqual(lessons[0].buildingAddress, "Piazza Leonardo da Vinci 32");
assert.strictEqual(lessons[0].professors[0], "VALENTE GIOVANNI");
assert.strictEqual(lessons[0].date, "20260917");

console.log("lessons.selfcheck: OK");
