import test from "node:test";
import assert from "node:assert/strict";
import type { RevisionLabStep } from "../../server/types.js";
import {
  arrangeNodes,
  boardBounds,
  clampPosition,
  CARD_IMAGE_WIDTH,
  CARD_IMAGE_HEIGHT,
  displayNode,
  storedPosition,
  screenshotPreviewFrame,
  recordedClickPoint,
  clickConnectionStart,
  clickPreviewPoint,
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

const click = {
  target: { selector: "button", tag: "button", label: "Continue" },
  point: { x: 0.5, y: 0.35 },
  bounds: { x: 0.4, y: 0.3, width: 0.2, height: 0.1 },
  activation: "pointer" as const,
};

test("the thumbnail frame doubles in both dimensions without changing saved layouts", () => {
  assert.equal(CARD_IMAGE_WIDTH, 298 * 2);
  assert.equal(CARD_IMAGE_HEIGHT, 210 * 2);
  const saved = { stepId: "one", x: 408, y: 48 };
  const displayed = displayNode(saved);
  assert.deepEqual(displayed, { stepId: "one", x: 816, y: 96 });
  assert.deepEqual(storedPosition(displayed.x, displayed.y), { x: 408, y: 48 });
  assert.deepEqual(saved, { stepId: "one", x: 408, y: 48 });
  // Drag deltas are converted back before autosave, including fractional zoom.
  assert.deepEqual(storedPosition(displayed.x + 40, displayed.y + 20), { x: 428, y: 58 });
});

test("the connector begins at the saved click point, rather than the target bounds edge", () => {
  const point = clickPreviewPoint(capturedStep, click);
  assert.ok(point);
  assert.equal(point.x, 299);
  assert.ok(Math.abs(point.y - 137.3) < 0.001);
  const source = displayNode(arrangeNodes(["one"])[0]);
  const start = clickConnectionStart(source, point);
  assert.equal(start.x, 395);
  assert.ok(Math.abs(start.y - 233.3) < 0.001);
  assert.deepEqual(clickPreviewPoint(capturedStep, { ...click, bounds: null }), point);
  assert.deepEqual(recordedClickPoint({ ...click, point: null }), { x: 0.5, y: 0.35 });
});

test("previously cropped side and bottom clicks remain aligned on a full landscape preview", () => {
  assert.deepEqual(screenshotPreviewFrame(capturedStep), { x: 0, y: 0, width: 596, height: 298 });
  const point = clickPreviewPoint(capturedStep, { ...click, point: { x: 0.01, y: 0.95 } });
  assert.ok(point);
  assert.ok(Math.abs(point.x - 6.96) < 0.001);
  assert.ok(Math.abs(point.y - 316.1) < 0.001);
});

test("portrait clicks include horizontal letterboxing and stay at the saved image location", () => {
  const portrait = { ...capturedStep, capture: { ...capturedStep.capture!, width: 400, height: 1200 } };
  assert.deepEqual(screenshotPreviewFrame(portrait), { x: 228, y: 0, width: 140, height: 420 });
  assert.deepEqual(clickPreviewPoint(portrait, { ...click, point: { x: 0.1, y: 0.9 } }), { x: 243, y: 411 });
});

test("legacy, missing, outside-image and invalid evidence never invent a dot", () => {
  assert.equal(clickPreviewPoint({ ...capturedStep, screenshot: null }, click), null);
  assert.equal(clickPreviewPoint({ ...capturedStep, capture: null }, click), null);
  assert.equal(clickPreviewPoint(capturedStep, null), null);
  assert.equal(clickPreviewPoint(capturedStep, { ...click, point: null, bounds: null }), null);
  for (const x of [-0.1, 1.1, NaN, Infinity]) {
    assert.equal(clickPreviewPoint(capturedStep, { ...click, point: { x, y: 0.5 } }), null);
  }
  for (const width of [0, -1, NaN, Infinity]) {
    assert.equal(clickPreviewPoint({ ...capturedStep, capture: { ...capturedStep.capture!, width } }, click), null);
    assert.equal(recordedClickPoint({ ...click, point: null, bounds: { ...click.bounds, width } }), null);
  }
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
    width: 1646,
    height: 1558,
  });
});

test("recorded arrows connect card edges, not screenshot centers", () => {
  const [first, second] = arrangeNodes(["one", "two"]).map(displayNode);
  const geometry = connectionGeometry(first, second);
  assert.deepEqual(geometry?.start, { x: 694, y: 351 });
  assert.deepEqual(geometry?.end, { x: 816, y: 351 });
  assert.equal(geometry?.length, 122);
  assert.equal(geometry?.angle, 0);
});

test("coincident or overlapping cards never produce invalid connector geometry", () => {
  const [node] = arrangeNodes(["one"]);
  assert.equal(connectionGeometry(node, node), null);
  assert.equal(connectionGeometry(node, { ...node, x: node.x + 20 }), null);
});

test("manual branches route below screens and distinguish return paths", () => {
  const nodes = arrangeNodes(["one", "two", "three"]).map(displayNode);
  const points = manualConnectionPoints(nodes[0], nodes[2]);
  assert.equal(points[0].y, 606);
  assert.equal(points[1].y, 638);
  assert.equal(points[2].y, 638);
  assert.equal(points[3].y, 606);
  const reverse = manualConnectionPoints(nodes[2], nodes[0]);
  assert.notEqual(reverse[0].x, points[3].x);
});

test("recorded return and branch paths use separate lanes inside the fitted board", () => {
  const nodes = arrangeNodes(["a", "b", "c", "e"]).map(displayNode);
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
    assert.ok(lane > 606);
    assert.ok(lane + 48 <= bounds.height);
  }
});

test("overlapping and coincident cards keep recorded connections in visible, selectable lanes", () => {
  const nodes = [
    { stepId: "a", x: 96, y: 96 },
    { stepId: "b", x: 116, y: 96 },
    { stepId: "c", x: 116, y: 96 },
  ];
  const edges = [
    { id: "a-b", sourceStepId: "a", targetStepId: "b", kind: "recorded" as const, label: "" },
    { id: "b-c", sourceStepId: "b", targetStepId: "c", kind: "recorded" as const, label: "" },
  ];
  const lanes = connectionLanes(nodes, edges);
  assert.equal(lanes.size, 2);
  assert.notEqual(lanes.get("a-b"), lanes.get("b-c"));
  for (const edge of edges) {
    const lane = lanes.get(edge.id)!;
    const source = nodes.find((node) => node.stepId === edge.sourceStepId)!;
    const target = nodes.find((node) => node.stepId === edge.targetStepId)!;
    const points = manualConnectionPoints(source, target, lane);
    assert.ok(points.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y)));
    assert.ok(points[1].y > 606);
    assert.ok(boardBounds(nodes, edges).height >= lane + 48);
  }
});
