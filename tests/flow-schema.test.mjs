import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const flow = JSON.parse(await readFile(new URL("../public/demo-flow.json", import.meta.url), "utf8"));

test("published demo flow is deterministic", () => {
  assert.equal(flow.status, "published");
  assert.deepEqual(flow.steps.map((step) => step.order), [1, 2, 3]);
});

test("recorded targets contain no sensitive values", () => {
  const serialized = JSON.stringify(flow);
  assert.equal(serialized.includes("4242"), false);
  assert.equal(serialized.includes("example.test"), false);
});
