import test from "node:test";
import assert from "node:assert/strict";
import {
  fitBoard,
  MAX_BOARD_ZOOM,
  MIN_BOARD_ZOOM,
  wheelZoom,
  zoomAtPoint,
} from "./viewport.js";

function nearlyEqual(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} ≈ ${expected}`);
}

test("zoom keeps the same board point beneath the cursor after translation", () => {
  const camera = { zoom: 0.75, x: -280, y: 90 };
  const cursor = { x: 420, y: 275 };
  const world = {
    x: (cursor.x - camera.x) / camera.zoom,
    y: (cursor.y - camera.y) / camera.zoom,
  };

  for (const zoom of [0.02, 0.1, 1, 3]) {
    const next = zoomAtPoint(camera, zoom, cursor);
    nearlyEqual(world.x * next.zoom + next.x, cursor.x);
    nearlyEqual(world.y * next.zoom + next.y, cursor.y);
  }
});

test("zooming in and back out restores the original camera", () => {
  const camera = { zoom: 0.5, x: 130, y: -220 };
  const cursor = { x: 700, y: 120 };
  const next = zoomAtPoint(zoomAtPoint(camera, 2, cursor), camera.zoom, cursor);
  nearlyEqual(next.zoom, camera.zoom);
  nearlyEqual(next.x, camera.x);
  nearlyEqual(next.y, camera.y);
  assert.deepEqual(zoomAtPoint(camera, camera.zoom, cursor), camera);
});

test("fit contains the board and centers it without enlarging small boards", () => {
  assert.deepEqual(fitBoard(2000, 1000, 1000, 800), {
    zoom: 0.5,
    x: 0,
    y: 150,
  });
  assert.deepEqual(fitBoard(1000, 2000, 1000, 800), {
    zoom: 0.4,
    x: 300,
    y: 0,
  });
  assert.deepEqual(fitBoard(200, 100, 1000, 800), {
    zoom: 1,
    x: 400,
    y: 350,
  });
});

test("a very large fitted board zooms smoothly from below ten percent", () => {
  const camera = fitBoard(50000, 50000, 1000, 800);
  assert.equal(camera.zoom, 0.016);
  const minimum = Math.min(MIN_BOARD_ZOOM, camera.zoom);
  const nextZoom = wheelZoom(camera.zoom, -16, 0, 800, minimum);
  assert.ok(nextZoom > camera.zoom);
  assert.ok(nextZoom < MIN_BOARD_ZOOM);
  assert.equal(wheelZoom(camera.zoom, 16, 0, 800, minimum), camera.zoom);
  assert.equal(wheelZoom(camera.zoom, 0, 0, 800, minimum), camera.zoom);
  const resizedMinimum = fitBoard(50000, 50000, 2000, 1600).zoom;
  assert.equal(
    wheelZoom(camera.zoom, 100, 0, 1600, Math.min(resizedMinimum, camera.zoom)),
    camera.zoom,
  );
});

test("wheel direction and pixel, line, and page units produce equivalent zoom", () => {
  const pixelZoom = wheelZoom(1, 32, 0, 800);
  assert.ok(pixelZoom < 1);
  assert.ok(wheelZoom(1, -32, 0, 800) > 1);
  nearlyEqual(wheelZoom(1, 2, 1, 800), pixelZoom);
  nearlyEqual(wheelZoom(1, 0.04, 2, 800), pixelZoom);
  assert.equal(wheelZoom(1, 0, 0, 800), 1);
});

test("wheel respects both zoom limits and bounds a single large event", () => {
  assert.equal(wheelZoom(MAX_BOARD_ZOOM, -100, 0, 800), MAX_BOARD_ZOOM);
  assert.equal(wheelZoom(MIN_BOARD_ZOOM, 100, 0, 800), MIN_BOARD_ZOOM);
  assert.equal(wheelZoom(2.99, -100, 0, 800), MAX_BOARD_ZOOM);
  assert.equal(wheelZoom(0.101, 100, 0, 800), MIN_BOARD_ZOOM);
  assert.equal(wheelZoom(1, -1000000, 0, 800), wheelZoom(1, -100, 0, 800));
  assert.equal(wheelZoom(1, 1000000, 0, 800), wheelZoom(1, 100, 0, 800));
  assert.ok(wheelZoom(1, -1000000, 0, 800) < 1.25);
});

test("fit is safe while dimensions are zero, negative, or nonfinite", () => {
  for (const invalid of [0, -1, NaN, Infinity, -Infinity]) {
    for (let index = 0; index < 4; index++) {
      const dimensions: [number, number, number, number] = [640, 440, 800, 600];
      dimensions[index] = invalid;
      assert.deepEqual(fitBoard(...dimensions), { zoom: 1, x: 0, y: 0 });
    }
  }
});

test("invalid camera and wheel input cannot produce a nonfinite viewport", () => {
  for (const invalid of [0, -1, NaN, Infinity, -Infinity]) {
    const camera = zoomAtPoint(
      { zoom: invalid, x: NaN, y: Infinity },
      invalid,
      { x: NaN, y: Infinity },
    );
    assert.deepEqual(camera, { zoom: 1, x: 0, y: 0 });
    const zoom = wheelZoom(invalid, invalid, 2, invalid, invalid);
    assert.ok(Number.isFinite(zoom));
    assert.ok(zoom >= MIN_BOARD_ZOOM && zoom <= MAX_BOARD_ZOOM);
  }
});
