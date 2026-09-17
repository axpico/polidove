import assert from "node:assert";
import { buildQrModules } from "./qr.ts";

const grid = buildQrModules("https://polidove.example/?d=20260917&r=610086");

assert.ok(grid.length > 0, "grid should not be empty");
for (const row of grid) {
  assert.strictEqual(row.length, grid.length, "grid must be square");
}
assert.ok(
  grid.some((row) => row.some((cell) => cell)),
  "grid should contain at least one dark module",
);

const gridAgain = buildQrModules("https://polidove.example/?d=20260917&r=610086");
assert.deepStrictEqual(grid, gridAgain, "encoding the same text twice should be deterministic");

const differentGrid = buildQrModules("https://polidove.example/?d=20260918&r=1");
assert.notDeepStrictEqual(grid, differentGrid, "different text should produce a different grid");

console.log("qr.selfcheck: OK");
