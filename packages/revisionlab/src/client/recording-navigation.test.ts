import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyRecordingNavigation,
  confirmRecordingNavigation,
  recordingNavigationEvent,
  type RecordingNavigationRequest,
} from "./recording-navigation.js";

const current = "https://prototype.example/application?role=client#details";

test("different prototype pages and query states can continue recording", () => {
  for (const href of ["/confirmation", "?role=editor", "../start"]) {
    const target = classifyRecordingNavigation(href, current, "/revisionlab");
    assert.ok(target?.changesPage);
    assert.equal(target.canContinue, true);
    assert.equal(target.leavesDomain, false);
  }
});

test("same-page and fragment-only links do not interrupt recording", () => {
  for (const href of ["#summary", "", current, "/application?role=client"]) {
    assert.equal(
      classifyRecordingNavigation(href, current, "/revisionlab")?.changesPage,
      false,
    );
  }
});

test("workspace, API, and external destinations cannot continue recording", () => {
  for (const href of [
    "/revisionlab",
    "/revisionlab/access",
    "/api",
    "/api/revisionlab/state",
    "https://client.example/application",
    "//client.example/application",
  ]) {
    const target = classifyRecordingNavigation(href, current, "/revisionlab");
    assert.ok(target?.changesPage);
    assert.equal(target.canContinue, false);
  }
});

test("workspace boundaries support a configured prefix without matching similarly named pages", () => {
  assert.equal(
    classifyRecordingNavigation("/review/flows", current, "/review/")
      ?.canContinue,
    false,
  );
  assert.equal(
    classifyRecordingNavigation("/reviewer", current, "/review")?.canContinue,
    true,
  );
  assert.equal(
    classifyRecordingNavigation("/apiculture", current, "/review")?.canContinue,
    true,
  );
  assert.equal(
    classifyRecordingNavigation("/anything", current, "/")?.canContinue,
    false,
  );
});

test("non-page protocols and malformed destinations are never replayed", () => {
  for (const href of [
    "javascript:alert(1)",
    "data:text/html,test",
    "mailto:client@example.com",
    "tel:+441234567890",
    "https://[",
  ]) {
    assert.equal(
      classifyRecordingNavigation(href, current, "/revisionlab"),
      null,
    );
  }
});

test("only external host navigation fails closed without a mounted guard", async (t) => {
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
  );
  const browser = Object.assign(new EventTarget(), {
    location: new URL(current),
  });
  const recording = {
    flowId: "flow",
    name: "Application",
    persona: "Client",
    count: 1,
    lastRoute: "/application",
  };
  let persisted: object | null = recording;
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: browser,
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: { getItem: () => JSON.stringify(persisted) },
  });
  t.after(() => {
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (originalStorage)
      Object.defineProperty(globalThis, "sessionStorage", originalStorage);
    else Reflect.deleteProperty(globalThis, "sessionStorage");
  });

  for (const state of [
    recording,
    { ...recording, discardRequested: true },
    { ...recording, finishRequested: true },
  ]) {
    persisted = state;
    assert.equal(await confirmRecordingNavigation("/confirmation"), true);
    assert.equal(
      await confirmRecordingNavigation("https://elsewhere.example/"),
      false,
    );
  }
  assert.equal(await confirmRecordingNavigation("#details"), true);
  assert.equal(await confirmRecordingNavigation("javascript:alert(1)"), false);

  const guard = (event: Event) => {
    const detail = (event as CustomEvent<RecordingNavigationRequest>).detail;
    assert.equal(detail.href, "https://elsewhere.example/");
    detail.handled = true;
    queueMicrotask(() => detail.resolve(true));
  };
  browser.addEventListener(recordingNavigationEvent, guard);
  assert.equal(
    await confirmRecordingNavigation("https://elsewhere.example/"),
    true,
  );
  browser.removeEventListener(recordingNavigationEvent, guard);

  // Successful save/discard permits a host callback before React effect cleanup.
  persisted = null;
  assert.equal(await confirmRecordingNavigation("/confirmation"), true);
  assert.equal(
    await confirmRecordingNavigation("https://elsewhere.example/"),
    true,
  );
});

test("domain warnings use the exact hostname, including workspace and API links", () => {
  for (const href of [
    "/revisionlab",
    "/api/export",
    "https://prototype.example:8443/",
    "http://prototype.example/",
    "https://PROTOTYPE.example/page",
  ]) {
    assert.equal(
      classifyRecordingNavigation(href, current, "/revisionlab")?.leavesDomain,
      false,
    );
  }
  for (const href of [
    "https://other.example/",
    "https://sub.prototype.example/",
    "https://prototype.example.attacker.test/",
    "https://prototype.example@attacker.test/",
    "//elsewhere.example/",
  ]) {
    assert.equal(
      classifyRecordingNavigation(href, current, "/revisionlab")?.leavesDomain,
      true,
    );
  }
});
