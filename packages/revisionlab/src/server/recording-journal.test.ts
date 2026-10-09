import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";
import { unavailableAccessibility } from "../accessibility.js";

const capture = { width: 1000, height: 800, reason: "page", cursor: [], accessibility: unavailableAccessibility("not-scanned") };
const click = { target: { selector: "#next", tag: "a", label: "Next" }, point: { x: 0.3, y: 0.4 }, bounds: null, activation: "pointer" };
const reservation = (route: string, previousVisitId: string | null = null) => ({ id: randomUUID(), previousVisitId, route, title: route, capture, interaction: previousVisitId ? click : null });
const image = { state: "saved", screenshot: TEST_PNG, title: "Captured page", capture };

test("rapid visits persist both paths before images, including out-of-order completion and explicit gaps", async (t) => {
  const f = await reviewFixture(t), flowId = await f.flow();
  const a = reservation("/a"), b = reservation("/b", a.id), c = reservation("/c", b.id);
  for (const input of [a, b, c]) assert.equal((await f.call(`flows/${flowId}/visits`, "POST", input)).status, 201);
  let flow = (await f.state()).flows[0];
  assert.deepEqual(flow.steps.map((step) => step.route), ["/a", "/b", "/c"]);
  assert.deepEqual(flow.transitions!.map((path) => [path.sourceStepId, path.targetStepId]), [[a.id, b.id], [b.id, c.id]]);
  assert.equal(flow.transitions![1].interaction?.target.label, "Next");
  assert.ok(flow.steps.every((step) => step.captureState === "pending"));
  assert.equal((await f.call(`flows/${flowId}/finish`, "POST", {})).status, 409);
  assert.equal((await f.call(`flows/${flowId}`, "PATCH", { status: "complete" })).status, 409);
  assert.equal((await f.call(`flows/${flowId}/visits/${c.id}`, "PATCH", image)).status, 200);
  assert.equal((await f.call(`flows/${flowId}/visits/${b.id}`, "PATCH", { state: "unavailable", failure: "left-before-ready" })).status, 200);
  assert.equal((await f.call(`flows/${flowId}/visits/${a.id}`, "PATCH", image)).status, 200);
  assert.equal((await f.call(`flows/${flowId}/finish`, "POST", {})).status, 200);
  flow = (await f.state()).flows[0];
  assert.equal(flow.status, "complete");
  assert.equal(flow.steps[1].captureFailure, "left-before-ready");
  assert.equal(flow.transitions!.length, 2);
  assert.equal((await f.call(`flows/${flowId}/visits/${b.id}`, "PATCH", image)).status, 409);
});

test("stable journal IDs reconcile lost acknowledgments and reject reordered or changed evidence", async (t) => {
  const f = await reviewFixture(t), flowId = await f.flow();
  const a = reservation("/a"), b = reservation("/b", a.id);
  assert.equal((await f.call(`flows/${flowId}/visits`, "POST", b)).status, 409);
  for (let index = 0; index < 2; index++) assert.equal((await f.call(`flows/${flowId}/visits`, "POST", a)).status, 201);
  assert.equal((await f.call(`flows/${flowId}/visits`, "POST", { ...a, route: "/wrong" })).status, 409);
  assert.equal((await f.call(`flows/${flowId}/visits`, "POST", b)).status, 201);
  for (let index = 0; index < 2; index++) assert.equal((await f.call(`flows/${flowId}/visits/${a.id}`, "PATCH", image)).status, 200);
  assert.equal((await f.call(`flows/${flowId}/visits/${a.id}`, "PATCH", { state: "unavailable", failure: "failed" })).status, 200);
  const flow = (await f.state()).flows[0];
  assert.equal(flow.steps.length, 2);
  assert.equal(flow.steps[0].captureState, "saved");
  assert.equal((await f.client.execute("SELECT * FROM recording_visits")).rows.length, 2);
  assert.equal((await f.client.execute("SELECT * FROM artifacts")).rows.length, 1);
});

test("return visits reuse identical screens and remap queued successor paths without dropping evidence", async (t) => {
  const f = await reviewFixture(t), flowId = await f.flow();
  const a = reservation("/a"), b = reservation("/b", a.id), back = reservation("/a", b.id), c = reservation("/c", back.id);
  for (const input of [a, b, back, c]) await f.call(`flows/${flowId}/visits`, "POST", input);
  for (const input of [a, b, back, c]) assert.equal((await f.call(`flows/${flowId}/visits/${input.id}`, "PATCH", image)).status, 200);
  const flow = (await f.state()).flows[0];
  assert.equal(flow.steps.length, 3);
  assert.deepEqual(flow.transitions!.map((path) => [path.sourceStepId, path.targetStepId]), [[a.id, b.id], [b.id, a.id], [a.id, c.id]]);
  assert.equal(flow.board.edges.length, 3);
  assert.ok(flow.transitions!.every((path) => path.interaction?.target.label === "Next"));
  assert.equal((await f.call(`flows/${flowId}/visits`, "POST", back)).status, 201);
  assert.equal((await f.call(`flows/${flowId}/visits/${back.id}`, "PATCH", image)).status, 200);
});

test("journal reuse preserves edited provisional cards and user-removed recorded paths", async (t) => {
  const f = await reviewFixture(t), flowId = await f.flow();
  const a = reservation("/a"), b = reservation("/b", a.id);
  for (const input of [a, b]) { await f.call(`flows/${flowId}/visits`, "POST", input); await f.call(`flows/${flowId}/visits/${input.id}`, "PATCH", image); }
  const board = (await f.state()).flows[0].board;
  assert.equal((await f.call(`flows/${flowId}/board`, "PATCH", { ...board, edges: [] })).status, 200);
  const back = reservation("/a", b.id), again = reservation("/b", back.id);
  for (const input of [back, again]) { await f.call(`flows/${flowId}/visits`, "POST", input); await f.call(`flows/${flowId}/visits/${input.id}`, "PATCH", image); }
  const flow = (await f.state()).flows[0];
  assert.equal(flow.steps.length, 2);
  assert.equal(flow.board.edges.length, 1);
  assert.equal(flow.board.edges[0].sourceStepId, b.id);
  const edited = reservation("/a", again.id);
  await f.call(`flows/${flowId}/visits`, "POST", edited);
  await f.call("comments", "POST", { flowId, stepId: edited.id, route: "/a", body: "Keep this card" });
  await f.call(`flows/${flowId}/visits/${edited.id}`, "PATCH", image);
  assert.equal((await f.state()).flows[0].steps.length, 3);
  assert.ok((await f.state()).comments.some((comment) => comment.stepId === edited.id));
});

test("unavailable captures can recover, audits update their own saved visit and discard cannot resurrect work", async (t) => {
  const f = await reviewFixture(t), flowId = await f.flow(), a = reservation("/a");
  await f.call(`flows/${flowId}/visits`, "POST", a);
  assert.equal((await f.call(`flows/${flowId}/visits/${a.id}/audit`, "PATCH", unavailableAccessibility("changed"))).status, 409);
  await f.call(`flows/${flowId}/visits/${a.id}`, "PATCH", { state: "unavailable", failure: "not-ready" });
  await f.call(`flows/${flowId}/visits/${a.id}`, "PATCH", image);
  assert.equal((await f.call(`flows/${flowId}/visits/${a.id}/audit`, "PATCH", unavailableAccessibility("changed"))).status, 200);
  assert.equal((await f.state()).flows[0].steps[0].capture?.accessibility?.reason, "changed");
  assert.equal((await f.call(`flows/${flowId}/discard`, "POST", {})).status, 200);
  assert.equal((await f.call(`flows/${flowId}/visits`, "POST", a)).status, 404);
  assert.equal((await f.call(`flows/${flowId}/visits/${a.id}`, "PATCH", image)).status, 404);
  assert.equal((await f.state()).flows.length, 0);
});

test("journal endpoints enforce editor permissions, same-origin routes and privacy-shaped interaction data", async (t) => {
  const f = await reviewFixture(t), flowId = await f.flow(), a = reservation("/a");
  assert.equal((await f.call(`flows/${flowId}/visits`, "POST", a, await f.login("commenter"))).status, 403);
  for (const input of [{ ...a, route: "//evil.test" }, { ...a, interaction: { ...click, target: { ...click.target, value: "secret" } } }, { ...a, interaction: { ...click, point: { x: 2, y: 0 } } }]) assert.equal((await f.call(`flows/${flowId}/visits`, "POST", input)).status, 400);
  assert.equal((await f.state()).flows[0].steps.length, 0);
});

test("upgrading an active legacy recording preserves its last screen as the journal source", async (t) => {
  const f = await reviewFixture(t), flowId = await f.flow(), source = await f.capture(flowId);
  const next = reservation("/next");
  assert.equal((await f.call(`flows/${flowId}/visits`, "POST", next)).status, 201);
  await f.call(`flows/${flowId}/visits/${next.id}`, "PATCH", image);
  const flow = (await f.state()).flows[0];
  assert.equal(flow.transitions!.at(-1)!.sourceStepId, source);
  assert.equal(flow.transitions!.at(-1)!.targetStepId, next.id);
  assert.equal((await f.call(`flows/${flowId}/visits`, "POST", reservation("/wrong-order"))).status, 409);
});
