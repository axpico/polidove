import assert from "node:assert";
import { computeStatus } from "./status.ts";

const date = "20260917";

let r = computeStatus(date, "14:00", "16:00", new Date(2026, 8, 17, 13, 30));
assert.strictEqual(r.status, "boarding");
assert.strictEqual(r.countdownMinutes, 30, "30 min before start should show countdown");

r = computeStatus(date, "14:00", "16:00", new Date(2026, 8, 17, 12, 0));
assert.strictEqual(r.status, "boarding");
assert.strictEqual(r.countdownMinutes, null, "2h before start should hide countdown");

r = computeStatus(date, "14:00", "16:00", new Date(2026, 8, 17, 15, 0));
assert.strictEqual(r.status, "flying", "mid-lesson should be flying");

r = computeStatus(date, "14:00", "16:00", new Date(2026, 8, 17, 16, 0));
assert.strictEqual(r.status, "flying", "exact end time is still inclusive of flying");

r = computeStatus(date, "14:00", "16:00", new Date(2026, 8, 17, 16, 1));
assert.strictEqual(r.status, "landed", "just after end should be landed");

console.log("status.selfcheck: OK");
