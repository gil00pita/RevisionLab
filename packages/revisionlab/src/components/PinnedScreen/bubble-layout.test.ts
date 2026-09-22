import test from "node:test";
import assert from "node:assert/strict";
import { layoutCommentBubbles } from "./bubble-layout.js";

function assertReadableLayout(
  layout: ReturnType<typeof layoutCommentBubbles>,
  width: number,
) {
  assert.ok(Number.isFinite(layout.height));
  for (const [index, item] of layout.items.entries()) {
    for (const value of Object.values(item)) {
      if (typeof value === "number") assert.ok(Number.isFinite(value));
    }
    assert.ok(item.x >= 0);
    assert.ok(item.y >= 0);
    assert.ok(item.x + item.width <= width);
    assert.ok(item.y + item.height <= layout.height);
    assert.equal(item.width, Math.min(256, width));
    assert.equal(item.height, 128);
    assert.ok(item.tailX >= item.x && item.tailX <= item.x + item.width);
    assert.ok(item.tailY >= item.y && item.tailY <= item.y + item.height);
    assert.ok(
      item.tailX === item.x ||
        item.tailX === item.x + item.width ||
        item.tailY === item.y ||
        item.tailY === item.y + item.height,
      "the connector meets the preview boundary",
    );
    for (const previous of layout.items.slice(0, index)) {
      assert.ok(
        item.x + item.width + 12 <= previous.x ||
          previous.x + previous.width + 12 <= item.x ||
          item.y + item.height + 12 <= previous.y ||
          previous.y + previous.height + 12 <= item.y,
        `previews ${previous.id} and ${item.id} retain their gap`,
      );
    }
  }
}

test("empty images and unavailable dimensions produce a safe empty layout", () => {
  assert.deepEqual(layoutCommentBubbles([], 800, 600), {
    items: [],
    height: 600,
  });
  const points = [{ id: "one", x: 0.5, y: 0.5 }];
  for (const [width, height] of [
    [0, 0],
    [0, 600],
    [800, 0],
    [-20, 20],
    [NaN, 600],
    [800, Infinity],
  ]) {
    const layout = layoutCommentBubbles(points, width, height);
    assert.deepEqual(layout.items, []);
    assert.ok(Number.isFinite(layout.height));
    assert.ok(layout.height >= 0);
  }
});

test("isolated comments prefer a nearby side with a 20px pin gap", () => {
  const right = layoutCommentBubbles(
    [{ id: "right", x: 0.2, y: 0.5 }],
    1000,
    600,
  ).items[0];
  assert.equal(right.x, right.anchorX + 20);
  assert.equal(right.tailX, right.x);
  assert.equal(right.tailY, right.anchorY);
  const left = layoutCommentBubbles([{ id: "left", x: 0.8, y: 0.5 }], 1000, 600)
    .items[0];
  assert.equal(left.x + left.width, left.anchorX - 20);
  assert.equal(left.tailX, left.x + left.width);
  assert.equal(left.tailY, left.anchorY);
});

test("narrow images place previews above or below their anchor", () => {
  const below = layoutCommentBubbles(
    [{ id: "below", x: 0.5, y: 0.2 }],
    200,
    600,
  ).items[0];
  assert.equal(below.x, 0);
  assert.equal(below.y, below.anchorY + 20);
  const above = layoutCommentBubbles(
    [{ id: "above", x: 0.5, y: 0.8 }],
    200,
    600,
  ).items[0];
  assert.equal(above.y + above.height, above.anchorY - 20);
});

test("corners retain exact anchors and all previews remain readable", () => {
  const points = [
    { id: "top-left", x: 0, y: 0 },
    { id: "top-right", x: 1, y: 0 },
    { id: "bottom-left", x: 0, y: 1 },
    { id: "bottom-right", x: 1, y: 1 },
  ];
  const layout = layoutCommentBubbles(points, 800, 600);
  assertReadableLayout(layout, 800);
  assert.equal(layout.height, 600);
  assert.deepEqual(
    layout.items.map(({ anchorX, anchorY }) => [anchorX, anchorY]),
    [
      [0, 0],
      [800, 0],
      [0, 600],
      [800, 600],
    ],
  );
});

test("coincident pins get separate previews without changing saved points", () => {
  const points = Object.freeze(
    Array.from({ length: 24 }, (_, index) =>
      Object.freeze({ id: String(index), x: 0.5, y: 0.5 }),
    ),
  );
  const before = structuredClone(points);
  const layout = layoutCommentBubbles(points, 800, 600);
  assert.equal(layout.items.length, points.length);
  assertReadableLayout(layout, 800);
  assert.deepEqual(points, before);
  assert.ok(
    layout.items.every((item) => item.anchorX === 400 && item.anchorY === 300),
  );
  assert.ok(layout.height > 600);
});

test("dense comment sets extend vertically without horizontal overflow", () => {
  const points = Array.from({ length: 60 }, (_, index) => ({
    id: String(index),
    x: ((index * 37) % 101) / 100,
    y: ((index * 61) % 101) / 100,
  }));
  for (const width of [1, 160, 256, 320, 600, 1280]) {
    const layout = layoutCommentBubbles(points, width, 420);
    assert.equal(layout.items.length, points.length);
    assertReadableLayout(layout, width);
    assert.ok(layout.height > 420);
  }
});

test("layout is deterministic and preserves the supplied comment order", () => {
  const points = [
    { id: "z", x: 0.45, y: 0.2 },
    { id: "a", x: 0.46, y: 0.21 },
    { id: "m", x: 0.45, y: 0.2 },
  ];
  const first = layoutCommentBubbles(points, 600, 400);
  assert.deepEqual(first, layoutCommentBubbles(points, 600, 400));
  assert.deepEqual(
    first.items.map((item) => item.id),
    ["z", "a", "m"],
  );
});

test("short screenshots and malformed coordinates still have finite geometry", () => {
  const points = [
    { id: "outside", x: -1, y: 2 },
    { id: "invalid", x: NaN, y: Infinity },
  ];
  const layout = layoutCommentBubbles(points, 80, 1);
  assertReadableLayout(layout, 80);
  assert.equal(layout.items.length, 2);
  assert.deepEqual(
    layout.items.map(({ anchorX, anchorY }) => [anchorX, anchorY]),
    [
      [0, 1],
      [0, 0],
    ],
  );
});
