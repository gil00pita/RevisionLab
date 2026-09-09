import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const flow = JSON.parse(await readFile(new URL("../public/demo-flow.json", import.meta.url), "utf8"));

assert.equal(flow.schemaVersion, 1, "schemaVersion must be 1");
assert.match(flow.id, /^[a-z0-9-]+$/, "flow id must be a stable slug");
assert.ok(flow.steps.length > 0, "published flows require at least one step");
assert.deepEqual(flow.steps.map((step) => step.order), flow.steps.map((_, index) => index + 1), "step order must be contiguous");
assert.equal(new Set(flow.steps.map((step) => step.id)).size, flow.steps.length, "step ids must be unique");
assert.equal(new Set(flow.steps.map((step) => step.target.flowId)).size, flow.steps.length, "demo target ids must be unique");

console.log(`Validated ${flow.id}: ${flow.steps.length} deterministic steps.`);
