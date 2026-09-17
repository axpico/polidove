import assert from "node:assert";
import { encodeShareUrl, decodeShareParams } from "./share.ts";

const url = encodeShareUrl({ date: "20260917", idrichiesta: 610086 }, "https://polidove.example/");
assert.strictEqual(url, "https://polidove.example/?d=20260917&r=610086");

const parsed = decodeShareParams("?d=20260917&r=610086");
assert.deepStrictEqual(parsed, { date: "20260917", idrichiesta: 610086 });

assert.strictEqual(decodeShareParams("?d=abc&r=1"), null, "non-numeric date should be rejected");
assert.strictEqual(decodeShareParams("?d=20260917"), null, "missing idrichiesta should be rejected");
assert.strictEqual(decodeShareParams(""), null, "empty query should be rejected");

console.log("share.selfcheck: OK");
