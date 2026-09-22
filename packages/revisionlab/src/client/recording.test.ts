import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import {
  loadRecording,
  saveRecording,
  type ActiveRecording,
} from "./recording.js";

const storageKey = "revisionlab.recording";
const recording: ActiveRecording = {
  flowId: "test-recording",
  name: "Application flow",
  persona: "Client",
  count: 2,
  lastRoute: "/application",
};

function browserFixture(t: TestContext) {
  const originals = new Map(
    ["window", "sessionStorage"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const persisted = new Map<string, string>();
  const fail = { get: false, set: false, remove: false };
  const storage = {
    getItem(key: string) {
      if (fail.get) throw new Error("Storage access denied");
      return persisted.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      if (fail.set) throw new Error("Storage quota exceeded");
      persisted.set(key, value);
    },
    removeItem(key: string) {
      if (fail.remove) throw new Error("Storage access denied");
      persisted.delete(key);
    },
  };
  // Node's native EventTarget/Event provide the browser notification contract
  // without loading a DOM or adding a React test dependency.
  const browser = new EventTarget();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: storage,
  });
  saveRecording(null);
  const notifications: Event[] = [];
  const onRecording = (event: Event) => notifications.push(event);
  browser.addEventListener("revisionlab:recording", onRecording);
  t.after(() => {
    // Reset the module's volatile fallback through its public API before
    // restoring globals, so no test inherits an in-memory recording.
    fail.get = fail.set = fail.remove = false;
    browser.removeEventListener("revisionlab:recording", onRecording);
    saveRecording(null);
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  return { persisted, fail, notifications };
}

test("recording storage round-trips active and stopped states and notifies subscribers", (t) => {
  const f = browserFixture(t);
  assert.equal(loadRecording(), null);
  for (const state of [
    recording,
    { ...recording, finishRequested: true },
    { ...recording, discardRequested: true },
  ]) {
    saveRecording(state);
    assert.deepEqual(JSON.parse(f.persisted.get(storageKey)!), state);
    assert.deepEqual(loadRecording(), state);
  }
  assert.equal(f.notifications.length, 3);
  assert.ok(
    f.notifications.every((event) => event.type === "revisionlab:recording"),
  );
});

test("missing, malformed, or inaccessible stored recordings load safely", (t) => {
  const f = browserFixture(t);
  for (const value of [
    "{invalid",
    "null",
    "{}",
    JSON.stringify({ ...recording, flowId: null }),
    JSON.stringify({ ...recording, count: "2" }),
    JSON.stringify({ ...recording, persona: undefined }),
  ]) {
    f.persisted.set(storageKey, value);
    assert.equal(loadRecording(), null);
  }
  f.persisted.set(storageKey, JSON.stringify(recording));
  f.fail.get = true;
  assert.equal(loadRecording(), null);
});

test("failed writes retain the latest discard intent in memory instead of stale persisted data", (t) => {
  const f = browserFixture(t);
  saveRecording(recording);
  f.fail.set = true;
  const stopped = { ...recording, discardRequested: true };
  assert.doesNotThrow(() => saveRecording(stopped));
  assert.deepEqual(loadRecording(), stopped);
  assert.deepEqual(JSON.parse(f.persisted.get(storageKey)!), recording);
  assert.equal(f.notifications.length, 2);
});

test("fully unavailable storage still retains the stop-and-save retry state in memory", (t) => {
  const f = browserFixture(t);
  f.fail.get = f.fail.set = true;
  const stopped = { ...recording, finishRequested: true };
  assert.doesNotThrow(() => saveRecording(stopped));
  assert.deepEqual(loadRecording(), stopped);
  assert.equal(f.notifications.length, 1);
});

test("clearing after a successful server action masks stale storage when removal fails", (t) => {
  const f = browserFixture(t);
  saveRecording({ ...recording, discardRequested: true });
  f.fail.remove = true;
  assert.doesNotThrow(() => saveRecording(null));
  assert.equal(loadRecording(), null);
  assert.ok(f.persisted.has(storageKey));
  f.fail.get = true;
  assert.equal(loadRecording(), null);
  assert.equal(f.notifications.length, 2);
});

test("clearing after save or discard removes durable state and notifies subscribers", (t) => {
  const f = browserFixture(t);
  for (const state of [
    { ...recording, finishRequested: true },
    { ...recording, discardRequested: true },
  ]) {
    saveRecording(state);
    saveRecording(null);
    assert.equal(loadRecording(), null);
    assert.equal(f.persisted.has(storageKey), false);
  }
  assert.equal(f.notifications.length, 4);
});

test("a successful write after storage recovery clears the volatile override", (t) => {
  const f = browserFixture(t);
  f.fail.set = true;
  saveRecording({ ...recording, finishRequested: true });
  f.fail.set = false;
  saveRecording(recording);
  const externalUpdate = { ...recording, count: 3, discardRequested: true };
  f.persisted.set(storageKey, JSON.stringify(externalUpdate));
  assert.deepEqual(loadRecording(), externalUpdate);
});

test("a successful clear after storage recovery resets a null volatile override", (t) => {
  const f = browserFixture(t);
  saveRecording(recording);
  f.fail.remove = true;
  saveRecording(null);
  f.fail.remove = false;
  saveRecording(null);
  assert.equal(f.persisted.has(storageKey), false);
  f.persisted.set(storageKey, JSON.stringify(recording));
  assert.deepEqual(loadRecording(), recording);
});
