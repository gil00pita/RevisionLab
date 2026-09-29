import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { reviewFixture } from "./review-test-fixture.js";

const input = { name: "Checkout", persona: "Customer", route: "/checkout" };

test("duplicate names ignore casing and surrounding space and require confirmation without writes", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  await f.capture(id);
  await f.call(`flows/${id}`, "PATCH", { status: "complete" });
  const before = await f.state();
  const conflict = await f.call("flows", "POST", {
    ...input,
    name: "  CHECKOUT  ",
    persona: "Another persona",
  });
  assert.equal(conflict.status, 409);
  const body = await conflict.json();
  assert.equal(body.code, "FLOW_NAME_EXISTS");
  assert.deepEqual(
    body.conflicts.map((item: { id: string; canReplace: boolean }) => [
      item.id,
      item.canReplace,
    ]),
    [[id, true]],
  );
  assert.deepEqual((await f.state()).flows, before.flows);
});

test("confirmed replacement creates a new version and preserves prior screens and feedback", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const stepId = await f.capture(id);
  await f.call("comments", "POST", {
    body: "Keep this comment",
    route: "/checkout",
    flowId: id,
    stepId,
  });
  await f.call(`flows/${id}`, "PATCH", { status: "complete" });
  const before = await f.state();
  const persona = await f.call("personas", "POST", {
    name: "Replacement persona",
  });
  const personaId = (await persona.json()).id;
  const response = await f.call("flows", "POST", {
    name: "Checkout",
    route: "/new",
    personaId,
    replaceFlowId: id,
  });
  assert.equal(response.status, 201);
  const created = await response.json();
  assert.equal(created.familyId, id);
  assert.equal(created.version, 2);
  assert.equal(created.persona, "Replacement persona");
  const after = await f.state();
  assert.deepEqual(
    after.flows.find((flow) => flow.id === id),
    before.flows[0],
  );
  assert.deepEqual(after.comments, before.comments);
  assert.equal(
    after.flows.find((flow) => flow.id === created.id)?.previousVersionId,
    id,
  );
  assert.equal(
    (await f.call(`flows/${created.id}/discard`, "POST")).status,
    200,
  );
  assert.deepEqual((await f.state()).flows, before.flows);
});

test("active recordings and stale confirmations cannot replace a flow", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const blocked = await f.call("flows", "POST", {
    ...input,
    replaceFlowId: id,
  });
  assert.equal(blocked.status, 409);
  assert.equal((await blocked.json()).conflicts[0].canReplace, false);
  await f.call(`flows/${id}`, "PATCH", { status: "complete" });
  const next = await f.call("flows", "POST", { ...input, replaceFlowId: id });
  const newId = (await next.json()).id;
  await f.call(`flows/${newId}`, "PATCH", { status: "complete" });
  const stale = await f.call("flows", "POST", { ...input, replaceFlowId: id });
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).conflicts[0].id, newId);
  assert.equal((await f.state()).flows.length, 2);
  assert.equal(
    (
      await f.call("flows", "POST", {
        ...input,
        name: "Different",
        replaceFlowId: newId,
      })
    ).status,
    409,
  );
  const commenter = await f.login("commenter");
  assert.equal(
    (
      await f.call(
        "flows",
        "POST",
        { ...input, replaceFlowId: newId },
        commenter,
      )
    ).status,
    403,
  );
});

test("concurrent starts and confirmed replacements cannot create duplicate drafts", async (t) => {
  const f = await reviewFixture(t);
  const responses = await Promise.all([
    f.call("flows", "POST", input),
    f.call("flows", "POST", input),
  ]);
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [201, 409],
  );
  const id = (await f.state()).flows[0].id;
  await f.call(`flows/${id}`, "PATCH", { status: "complete" });
  const replacements = await Promise.all([
    f.call("flows", "POST", { ...input, replaceFlowId: id }),
    f.call("flows", "POST", { ...input, replaceFlowId: id }),
  ]);
  assert.deepEqual(
    replacements.map((response) => response.status).sort(),
    [201, 409],
  );
  assert.equal((await f.state()).flows.length, 2);
});

test("legacy duplicate families require an explicit target and leave other families unchanged", async (t) => {
  const f = await reviewFixture(t);
  const first = await f.flow();
  await f.call(`flows/${first}`, "PATCH", { status: "complete" });
  const second = randomUUID();
  await f.client.execute({
    sql: `INSERT INTO flows (id, family_id, version, name, persona, route, status, created_by, created_at, updated_at)
    SELECT ?, ?, 1, name, persona, route, status, created_by, created_at, updated_at FROM flows WHERE id = ?`,
    args: [second, second, first],
  });
  const conflict = await f.call("flows", "POST", input);
  assert.equal((await conflict.json()).conflicts.length, 2);
  const response = await f.call("flows", "POST", {
    ...input,
    replaceFlowId: second,
  });
  assert.equal(response.status, 201);
  assert.equal((await response.json()).familyId, second);
  assert.equal(
    (await f.state()).flows.filter((flow) => flow.familyId === first).length,
    1,
  );
});
