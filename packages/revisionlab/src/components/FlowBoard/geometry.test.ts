import test from "node:test";
import assert from "node:assert/strict";
import type { RevisionLabStep } from "../../server/types.js";
import {
  arrangeNodes,
  boardBounds,
  clampPosition,
  clickConnectionStart,
  clickPreviewRect,
  connectionGeometry,
  connectionLanes,
  manualConnectionPoints,
} from "./geometry.js";

const capturedStep: RevisionLabStep = {
  id: "one",
  flowId: "flow",
  title: "First screen",
  route: "/first",
  screenshot: "/capture.png",
  position: 0,
  createdAt: "2026-10-08T00:00:00Z",
  capture: { width: 1000, height: 500, reason: "click", cursor: [] },
};

test("recorded click bounds follow the centered, top-aligned screenshot crop", () => {
  const click = {
    target: { selector: "button", tag: "button", label: "Continue" },
    point: { x: 0.5, y: 0.35 },
    bounds: { x: 0.4, y: 0.3, width: 0.2, height: 0.1 },
    activation: "pointer" as const,
  };
  const rect = clickPreviewRect(capturedStep, click);
  assert.ok(rect);
  assert.equal(rect.x, 108);
  assert.equal(rect.y, 96);
  assert.equal(rect.width, 84);
  assert.ok(Math.abs(rect.height - 21) < 0.001);
  const [source, target] = arrangeNodes(["one", "two"]);
  assert.deepEqual(clickConnectionStart(source, target, rect!), {
    x: 240,
    y: 154.5,
  });
});

test("point-only clicks show a small marker and cropped or missing evidence has no marker", () => {
  const click = {
    target: { selector: "button", tag: "button", label: "Continue" },
    point: { x: 0.5, y: 0.5 },
    bounds: null,
    activation: "pointer" as const,
  };
  assert.deepEqual(clickPreviewRect(capturedStep, click), {
    x: 141,
    y: 129,
    width: 18,
    height: 18,
  });
  assert.equal(
    clickPreviewRect({ ...capturedStep, screenshot: null }, click),
    null,
  );
  assert.equal(
    clickPreviewRect(capturedStep, {
      ...click,
      bounds: { x: 0.01, y: 0.3, width: 0.04, height: 0.1 },
    }),
    null,
  );
});

test("screens arrange in captured order and wrap before coordinate limits", () => {
  const nodes = arrangeNodes(
    Array.from({ length: 200 }, (_, index) => String(index)),
  );
  assert.deepEqual(nodes[0], { stepId: "0", x: 48, y: 48 });
  assert.deepEqual(nodes[1], { stepId: "1", x: 408, y: 48 });
  assert.deepEqual(nodes[100], { stepId: "100", x: 48, y: 448 });
  assert.ok(nodes.every((node) => node.x <= 50000 && node.y <= 50000));
});

test("drag coordinates stay within the server bounds", () => {
  assert.equal(clampPosition(-12), 0);
  assert.equal(clampPosition(90000), 50000);
  assert.equal(clampPosition(14.7), 15);
});

test("board bounds include card dimensions and room for manual paths", () => {
  assert.deepEqual(boardBounds([]), { width: 640, height: 440 });
  assert.deepEqual(boardBounds([{ stepId: "one", x: 1000, y: 1000 }]), {
    width: 1348,
    height: 1348,
  });
});

test("recorded arrows connect card edges, not screenshot centers", () => {
  const [first, second] = arrangeNodes(["one", "two"]);
  const geometry = connectionGeometry(first, second);
  assert.deepEqual(geometry?.start, { x: 348, y: 198 });
  assert.deepEqual(geometry?.end, { x: 408, y: 198 });
  assert.equal(geometry?.length, 60);
  assert.equal(geometry?.angle, 0);
});

test("coincident or overlapping cards never produce invalid connector geometry", () => {
  const [node] = arrangeNodes(["one"]);
  assert.equal(connectionGeometry(node, node), null);
  assert.equal(connectionGeometry(node, { ...node, x: node.x + 20 }), null);
});

test("manual branches route below screens and distinguish return paths", () => {
  const nodes = arrangeNodes(["one", "two", "three"]);
  const points = manualConnectionPoints(nodes[0], nodes[2]);
  assert.equal(points[0].y, 348);
  assert.equal(points[1].y, 380);
  assert.equal(points[2].y, 380);
  assert.equal(points[3].y, 348);
  const reverse = manualConnectionPoints(nodes[2], nodes[0]);
  assert.notEqual(reverse[0].x, points[3].x);
});

test("recorded return and branch paths use separate lanes inside the fitted board", () => {
  const nodes = arrangeNodes(["a", "b", "c", "e"]);
  const edges = [
    ["a", "b"],
    ["b", "c"],
    ["c", "a"],
    ["a", "e"],
  ].map(([sourceStepId, targetStepId]) => ({
    id: `${sourceStepId}-${targetStepId}`,
    sourceStepId,
    targetStepId,
    kind: "recorded" as const,
    label: "",
  }));
  const lanes = connectionLanes(nodes, edges);
  assert.equal(lanes.size, 2);
  assert.equal(lanes.has("a-b"), false);
  assert.notEqual(lanes.get("c-a"), lanes.get("a-e"));
  const bounds = boardBounds(nodes, edges);
  for (const lane of lanes.values()) {
    assert.ok(lane > 348);
    assert.ok(lane + 48 <= bounds.height);
  }
});
