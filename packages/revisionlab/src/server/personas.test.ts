import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@libsql/client";
import { readPersonas } from "./persona-routes.js";
import { reviewFixture } from "./review-test-fixture.js";

test("saved personas persist, can be edited and archived, and retain historical recording labels", async (t) => {
  const f = await reviewFixture(t);
  assert.deepEqual((await f.state()).personas, []);
  const created = await f.call("personas", "POST", {
    name: "  Customer  ",
    description: " First purchase ",
  });
  assert.equal(created.status, 201);
  const personaId = (await created.json()).id;
  const recording = await f.call("flows", "POST", {
    name: "Checkout",
    personaId,
    route: "/checkout",
  });
  assert.equal(recording.status, 201);
  const flow = await recording.json();
  assert.equal(flow.persona, "Customer");
  await f.capture(flow.id);
  await f.call(`flows/${flow.id}`, "PATCH", { status: "complete" });
  assert.equal(
    (
      await f.call(`personas/${personaId}`, "PATCH", {
        name: "Returning customer",
        description: "Has an account",
      })
    ).status,
    200,
  );
  assert.equal((await f.state()).flows[0].persona, "Customer");
  assert.equal(
    (await f.call(`personas/${personaId}`, "PATCH", { archived: true })).status,
    200,
  );
  assert.equal(
    (await f.call("flows", "POST", { name: "Denied", personaId, route: "/" }))
      .status,
    409,
  );
  const snapshot = (await f.state()).personas;
  assert.equal(snapshot[0].name, "Returning customer");
  assert.ok(snapshot[0].archivedAt);
  const reopened = createClient({ url: f.config.databaseUrl });
  try {
    assert.deepEqual(await readPersonas(reopened), snapshot);
  } finally {
    reopened.close();
  }
  const version = await f.call(`flows/${flow.id}/versions`, "POST", {});
  assert.equal(version.status, 201);
  assert.ok(
    (await f.state()).flows.every((item) => item.persona === "Customer"),
  );
  assert.equal(
    (await f.call(`personas/${personaId}`, "PATCH", { archived: false }))
      .status,
    200,
  );
  const next = await f.call("flows", "POST", {
    name: "New journey",
    personaId,
    route: "/",
  });
  assert.equal(next.status, 201);
  assert.equal((await next.json()).persona, "Returning customer");
});

test("persona management is restricted to editors and owners and rejects invalid or duplicate names", async (t) => {
  const f = await reviewFixture(t);
  const commenter = await f.login("commenter");
  assert.equal(
    (await f.call("personas", "POST", { name: "Customer" }, commenter)).status,
    403,
  );
  const editor = await f.login("editor");
  const created = await f.call(
    "personas",
    "POST",
    { name: "Customer" },
    editor,
  );
  assert.equal(created.status, 201);
  const id = (await created.json()).id;
  assert.equal(
    (await f.call(`personas/${id}`, "PATCH", { archived: true }, commenter))
      .status,
    403,
  );
  assert.equal(
    (await f.call(`personas/${id}`, "PATCH", { name: "Changed" }, commenter))
      .status,
    403,
  );
  assert.equal(
    (await f.call("state", "GET", undefined, commenter)).status,
    200,
  );
  for (const body of [
    { name: "" },
    { name: " " },
    { name: "x".repeat(121) },
    { name: "Valid", description: "x".repeat(1001) },
    { name: "Valid", secret: "no" },
  ])
    assert.equal((await f.call("personas", "POST", body)).status, 400);
  assert.equal(
    (await f.call("personas", "POST", { name: " CUSTOMER " })).status,
    409,
  );
  assert.equal(
    (await f.call(`personas/${id}`, "PATCH", { archived: true }, editor))
      .status,
    200,
  );
  assert.equal(
    (await f.call("personas", "POST", { name: "customer" })).status,
    409,
  );
  assert.equal(
    (await f.call(`personas/${randomUUID()}`, "PATCH", { archived: true }))
      .status,
    404,
  );
  assert.equal(
    (
      await f.call("flows", "POST", {
        name: "Bad",
        personaId: randomUUID(),
        route: "/",
      })
    ).status,
    404,
  );
  assert.equal(
    (
      await f.call("flows", "POST", {
        name: "Bad",
        personaId: id,
        persona: "Spoof",
        route: "/",
      })
    ).status,
    400,
  );
  assert.equal(
    (await f.call("flows", "POST", { name: "Bad", route: "/" })).status,
    400,
  );
});

test("concurrent persona creation cannot create duplicate names", async (t) => {
  const f = await reviewFixture(t);
  const responses = await Promise.all([
    f.call("personas", "POST", { name: "Customer" }),
    f.call("personas", "POST", { name: "customer" }),
  ]);
  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [201, 409],
  );
  assert.equal((await f.state()).personas.length, 1);
});
