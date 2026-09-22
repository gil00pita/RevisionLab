import test from "node:test";
import assert from "node:assert/strict";
import {
  arrangeNodes,
  boardBounds,
  clampPosition,
  connectionGeometry,
  manualConnectionPoints,
} from "./geometry.js";

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
    width: 1328,
    height: 1308,
  });
});

test("recorded arrows connect card edges, not screenshot centers", () => {
  const [first, second] = arrangeNodes(["one", "two"]);
  const geometry = connectionGeometry(first, second);
  assert.deepEqual(geometry?.start, { x: 328, y: 178 });
  assert.deepEqual(geometry?.end, { x: 408, y: 178 });
  assert.equal(geometry?.length, 80);
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
  assert.equal(points[0].y, 308);
  assert.equal(points[1].y, 340);
  assert.equal(points[2].y, 340);
  assert.equal(points[3].y, 308);
  const reverse = manualConnectionPoints(nodes[2], nodes[0]);
  assert.notEqual(reverse[0].x, points[3].x);
});
