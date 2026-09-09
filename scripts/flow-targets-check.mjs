import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [source, flowSource] = await Promise.all([
  readFile(new URL("../components/views/preview-view.tsx", import.meta.url), "utf8"),
  readFile(new URL("../public/demo-flow.json", import.meta.url), "utf8"),
]);
const flow = JSON.parse(flowSource);
for (const step of flow.steps) {
  assert.ok(source.includes(`data-flow-id=\"${step.target.flowId}\"`), `Missing stable target: ${step.target.flowId}`);
}
console.log(`Resolved ${flow.steps.length} stable targets in the demo prototype.`);
