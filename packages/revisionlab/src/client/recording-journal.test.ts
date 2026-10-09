import assert from "node:assert/strict";
import test, { type TestContext } from "node:test";
import { randomUUID } from "node:crypto";
import { RecordingJournal } from "./recording-journal/journal.js";
import { saveRecording, loadRecording } from "./recording.js";
import { writeJournal } from "./recording-journal/storage.js";
import { unavailableAccessibility } from "../accessibility.js";
import type { InteractionSnapshot } from "./interaction-snapshot.js";

const capture = { width: 1000, height: 800, reason: "page" as const, cursor: [] };
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function snapshot(image: InteractionSnapshot["image"], signature = "state"): InteractionSnapshot {
  return { ...capture, title: "Captured state", signature, accessibility: unavailableAccessibility("not-scanned"), image };
}
async function until(predicate: () => boolean) {
  const started = Date.now();
  while (!predicate()) {
    if (Date.now() - started > 5000) throw new Error("Journal did not progress.");
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}
function fixture(t: TestContext) {
  const stored = new Map<string, string>(), images = new Map<string, unknown>();
  const originals = new Map(["window", "sessionStorage", "indexedDB"].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
  Object.defineProperty(globalThis, "window", { configurable: true, value: new EventTarget() });
  Object.defineProperty(globalThis, "sessionStorage", { configurable: true, value: { getItem: (key: string) => stored.get(key) ?? null, setItem: (key: string, value: string) => stored.set(key, value), removeItem: (key: string) => stored.delete(key) } });
  Object.defineProperty(globalThis, "indexedDB", { configurable: true, value: { open: () => {
    const request: Record<string, unknown> = {};
    request.result = { transaction: () => {
      const transaction: Record<string, unknown> = {};
      transaction.objectStore = () => ({
        put: (value: { id: string }) => { images.set(value.id, value); const result = { result: value.id }; setTimeout(() => (transaction.oncomplete as () => void)?.(), 0); return result; },
        get: (id: string) => { const result = { result: images.get(id) }; setTimeout(() => (transaction.oncomplete as () => void)?.(), 0); return result; },
        delete: (id: string) => { images.delete(id); const result = {}; setTimeout(() => (transaction.oncomplete as () => void)?.(), 0); return result; },
      });
      return transaction;
    } };
    queueMicrotask(() => (request.onsuccess as () => void)?.());
    return request;
  } } });
  const flowId = randomUUID();
  saveRecording({ flowId, name: "Fast flow", persona: "Customer", count: 0, lastRoute: "" });
  writeJournal(null);
  const calls: { path: string; body: Record<string, unknown> }[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    const body = JSON.parse(String(options.body));
    calls.push({ path: url, body });
    return new Response(JSON.stringify({ id: body.id, count: 3, ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  });
  t.after(() => { saveRecording(null); writeJournal(null); for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else Reflect.deleteProperty(globalThis, key); } });
  return { flowId, calls, stored };
}

test("navigation reserves all routes while earlier image and audit jobs are unresolved; Stop drains them", async (t) => {
  const f = fixture(t), journal = new RecordingJournal("/api/revisionlab", f.flowId);
  const first = deferred<{ screenshot: string }>(), audit = deferred<ReturnType<typeof unavailableAccessibility>>();
  const a = journal.append("/a", "A", capture);
  journal.freeze(a, snapshot(first.promise), capture, audit.promise);
  const b = journal.append("/b", "B", capture);
  journal.unavailable(b, "left-before-ready");
  const c = journal.append("/c", "C", capture);
  journal.freeze(c, snapshot(Promise.resolve({ screenshot: "image C" }), "C"), capture);
  await until(() => f.calls.filter((call) => call.path.endsWith("/visits")).length === 3);
  assert.deepEqual(f.calls.filter((call) => call.path.endsWith("/visits")).map((call) => call.body.route), ["/a", "/b", "/c"]);
  assert.equal(b.previousVisitId, a.id);
  assert.equal(c.previousVisitId, b.id);
  saveRecording({ ...loadRecording()!, finishRequested: true });
  let finished = false;
  const drain = journal.drain().then(() => { finished = true; });
  first.resolve({ screenshot: "image A" });
  await until(() => a.uploaded === true);
  assert.equal(finished, false);
  audit.resolve(unavailableAccessibility("changed"));
  await drain;
  assert.equal(journal.status().pending, 0);
  assert.equal(a.audited, true);
  assert.ok(f.calls.some((call) => call.path.endsWith(`/visits/${b.id}`) && call.body.state === "unavailable"));
});

test("reservation retries use immutable evidence even when the image finishes before acknowledgment", async (t) => {
  const f = fixture(t), held = deferred<Response>();
  let request = 0;
  const bodies: unknown[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    if (url.endsWith("/visits")) {
      bodies.push(JSON.parse(String(options.body)));
      if (request++ === 0) return held.promise;
    }
    return new Response(JSON.stringify({ count: 1 }), { status: 200 });
  });
  const journal = new RecordingJournal("/api/revisionlab", f.flowId), entry = journal.append("/a", "Original title", capture);
  await until(() => bodies.length === 1);
  journal.freeze(entry, snapshot(Promise.resolve({ screenshot: "image" })), capture);
  held.resolve(new Response(JSON.stringify({ error: "Temporary failure" }), { status: 503 }));
  await journal.drain();
  assert.equal(bodies.length, 2);
  assert.deepEqual(bodies[0], bodies[1]);
  assert.equal(entry.title, "Captured state");
});

test("same-origin reload resumes a queued visit and reports an interrupted image without removing its path", async (t) => {
  const f = fixture(t), id = randomUUID();
  f.stored.set("revisionlab.recording-journal", JSON.stringify({ flowId: f.flowId, entries: [{ id, previousVisitId: null, route: "/interrupted", title: "Interrupted page", capture, reservation: { title: "Interrupted page", capture }, interaction: null, state: "rendering", reserved: false }] }));
  const journal = new RecordingJournal("/api/revisionlab", f.flowId);
  await journal.drain();
  assert.equal(journal.data.entries[0].id, id);
  assert.equal(journal.data.entries[0].failure, "interrupted");
  assert.equal(f.calls.filter((call) => call.path.endsWith("/visits")).length, 1);
  assert.ok(f.calls.some((call) => call.body.failure === "interrupted"));
});

test("discard prevents a late frozen image from uploading or restoring the journal", async (t) => {
  const f = fixture(t), image = deferred<{ screenshot: string }>();
  const journal = new RecordingJournal("/api/revisionlab", f.flowId), entry = journal.append("/a", "A", capture);
  journal.freeze(entry, snapshot(image.promise), capture);
  await until(() => entry.reserved);
  saveRecording({ ...loadRecording()!, discardRequested: true });
  const discarded = journal.discard();
  image.resolve({ screenshot: "late image" });
  await discarded;
  assert.equal(f.calls.filter((call) => call.path.endsWith(`/visits/${entry.id}`)).length, 0);
  assert.equal(f.stored.has("revisionlab.recording-journal"), false);
});

test("repeated Stop notifications do not reopen an already acknowledged unavailable capture", async (t) => {
  const f = fixture(t), journal = new RecordingJournal("/api/revisionlab", f.flowId);
  const entry = journal.append("/loading", "Loading", capture);
  window.addEventListener("revisionlab:recording", () => journal.unavailable(entry, "not-ready"));
  saveRecording({ ...loadRecording()!, finishRequested: true });
  await journal.drain();
  assert.equal(entry.uploaded, true);
  assert.equal(journal.status().pending, 0);
  assert.equal(f.calls.filter((call) => call.path.endsWith(`/visits/${entry.id}`)).length, 1);
});

test("late-ready image survives an earlier unavailable upload finishing out of order", async (t) => {
  const f = fixture(t), held = deferred<Response>(), bodies: Record<string, unknown>[] = [];
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    const body = JSON.parse(String(options.body));
    if (!url.endsWith("/visits")) {
      bodies.push(body);
      if (body.state === "unavailable") return held.promise;
    }
    return new Response(JSON.stringify({ count: 1 }), { status: 200 });
  });
  const journal = new RecordingJournal("/api/revisionlab", f.flowId), entry = journal.append("/slow", "Slow", capture);
  journal.unavailable(entry, "not-ready");
  await until(() => bodies.length === 1);
  journal.freeze(entry, snapshot(Promise.resolve({ screenshot: "late ready image" })), capture);
  await until(() => entry.state === "saved");
  held.resolve(new Response(JSON.stringify({ count: 1 }), { status: 200 }));
  await journal.drain();
  assert.equal(entry.uploaded, true);
  assert.equal(entry.state, "saved");
  assert.ok(bodies.some((body) => body.state === "saved" && body.screenshot === "late ready image"));
});

test("reaching the recording limit stops observation explicitly and still allows existing visits to finish", async (t) => {
  const f = fixture(t), journal = new RecordingJournal("/api/revisionlab", f.flowId);
  saveRecording({ ...loadRecording()!, count: 200 });
  assert.throws(() => journal.append("/beyond-limit", "Too many", capture), /limit reached/);
  assert.equal(journal.data.entries.length, 0);
  assert.equal(journal.status().limited, true);
  assert.match(journal.status().warning, /Stop to save/);
  await journal.drain();
  assert.equal(journal.status().pending, 0);
});
