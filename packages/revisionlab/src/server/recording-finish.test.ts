import assert from "node:assert/strict";
import test from "node:test";
import { reviewFixture, TEST_PNG } from "./review-test-fixture.js";

test("Stop removes an empty draft, records history, and tolerates a lost response retry", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await f.call(`flows/${id}/finish`, "POST", {});
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { outcome: "empty" });
    assert.deepEqual((await f.state()).flows, []);
  }
  const history = await f.client.execute("SELECT action FROM workspace_history WHERE action = 'Stopped a recording'");
  assert.equal(history.rows.length, 1);
});

test("Stop saves persisted screens and retries without changing completed versions", async (t) => {
  const f = await reviewFixture(t);
  const id = await f.flow();
  const step = await f.capture(id);
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await f.call(`flows/${id}/finish`, "POST", {});
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { outcome: "saved" });
    const flow = (await f.state()).flows[0];
    assert.equal(flow.status, "complete");
    assert.equal(flow.steps[0].id, step);
    assert.equal(flow.steps.length, 1);
  }
  assert.equal((await f.call(`flows/${id}/steps`, "POST", { title: "Too late", route: "/" })).status, 409);
});

test("empty Stop preserves earlier versions and permits a replacement recording", async (t) => {
  const f = await reviewFixture(t);
  const first = await f.flow();
  await f.capture(first);
  await f.call(`flows/${first}/finish`, "POST", {});
  const before = (await f.state()).flows;
  const next = await (await f.call(`flows/${first}/versions`, "POST", {})).json();
  const response = await f.call(`flows/${next.id}/finish`, "POST", {});
  assert.deepEqual(await response.json(), { outcome: "empty" });
  assert.deepEqual((await f.state()).flows, before);
  assert.equal((await f.call(`flows/${first}/versions`, "POST", {})).status, 201);
});

test("empty Stop preserves discard permissions and all Stop requests reject commenters", async (t) => {
  const f = await reviewFixture(t);
  const ownerDraft = await f.flow();
  const editor = await f.login("editor");
  const commenter = await f.login("commenter");
  for (const cookie of [editor, commenter]) {
    assert.equal((await f.call(`flows/${ownerDraft}/finish`, "POST", {}, cookie)).status, 403);
  }
  assert.equal((await f.state()).flows[0].status, "recording");
  const draft = await (await f.call("flows", "POST", { name: "Editor draft", persona: "Client", route: "/" }, editor)).json();
  assert.equal((await f.call(`flows/${draft.id}/finish`, "POST", {}, editor)).status, 200);
  await f.capture(ownerDraft);
  assert.equal((await f.call(`flows/${ownerDraft}/finish`, "POST", {}, commenter)).status, 403);
});

test("concurrent Stop and capture never remove a committed screen", async (t) => {
  const f = await reviewFixture(t);
  for (const captureFirst of [true, false]) {
    const id = await f.flow();
    const capture = () => f.call(`flows/${id}/steps`, "POST", { title: "Checkout", route: "/checkout", screenshot: TEST_PNG });
    const finish = () => f.call(`flows/${id}/finish`, "POST", {});
    const responses = await Promise.all(captureFirst ? [capture(), finish()] : [finish(), capture()]);
    const [captured, stopped] = captureFirst ? responses : responses.reverse();
    assert.equal(stopped.status, 200);
    const outcome = (await stopped.json()).outcome;
    const flow = (await f.state()).flows.find((item) => item.id === id);
    if (captured.status === 201) {
      assert.equal(outcome, "saved");
      assert.equal(flow?.status, "complete");
      assert.equal(flow?.steps.length, 1);
    } else {
      assert.equal(captured.status, 404);
      assert.equal(outcome, "empty");
      assert.equal(flow, undefined);
    }
  }
});
