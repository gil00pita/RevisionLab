import assert from "node:assert/strict";
import { test } from "node:test";
import { configureBundler } from "./bundler.js";

test("Next 16 uses Webpack and preserves flags, formatting, and unrelated fields", () => {
  const source =
    '{\n\t"name": "host",\n\t"scripts": {"dev":"next dev --turbo --port 4000", "build":"next build --turbopack", "start":"next start", "test":"vitest"}\n}\n';
  const result = configureBundler(source, 16);
  assert.equal(
    result.content,
    source
      .replace("next dev --turbo --port 4000", "next dev --port 4000 --webpack")
      .replace("next build --turbopack", "next build --webpack"),
  );
  assert.deepEqual(result.updatedScripts, ["dev", "build"]);
  assert.deepEqual(result.warnings, []);
  assert.equal(configureBundler(result.content, 16).content, result.content);
});

test("Next 15 removes Turbopack flags without adding an unsupported Webpack flag", () => {
  const source = JSON.stringify({
    scripts: {
      dev: "next dev --turbopack -p 4321",
      build: "next build --turbo",
    },
  });
  const result = JSON.parse(configureBundler(source, 15).content);
  assert.equal(result.scripts.dev, "next dev -p 4321");
  assert.equal(result.scripts.build, "next build");
  const unchanged = JSON.stringify({
    scripts: { dev: "next dev", build: "next build" },
  });
  assert.equal(configureBundler(unchanged, 15).content, unchanged);
});

test("custom commands are untouched and receive actionable guidance", () => {
  for (const dev of [
    "cross-env NODE_ENV=development next dev",
    "npm run prepare && next dev",
    "node scripts/dev.mjs",
    "next dev --port $PORT",
    "next dev -- --custom",
  ]) {
    const source = JSON.stringify({
      scripts: { dev, build: "next build --webpack", lint: "eslint" },
    });
    const result = configureBundler(source, 16);
    assert.equal(result.content, source);
    assert.equal(result.warnings.length, 1);
    assert.match(result.warnings[0], /Kept custom script "dev" unchanged/);
    assert.match(result.warnings[0], /next dev --webpack/);
  }
});
