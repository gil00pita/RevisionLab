import assert from "node:assert/strict";
import { test } from "node:test";
import { collectDependencyConflicts } from "./dependency-diagnostics.js";

test("diagnostics include distinct nested peer constraints without duplicate paths", () => {
  const invalidEslint = {
    version: "9.39.5",
    invalid: '"^10.0.0" from node_modules/@eslint/js',
  };
  assert.deepEqual(
    collectDependencyConflicts({
      problems: [
        "invalid: eslint@9.39.5 /prototype/node_modules/eslint",
        "missing: revisionlab@0.1.13, required by prototype",
      ],
      dependencies: {
        eslint: invalidEslint,
        "@eslint/js": { dependencies: { eslint: invalidEslint } },
        "@storybook/addon-vitest": {
          dependencies: {
            vitest: {
              version: "5.0.1",
              invalid:
                '"^3.0.0 || ^4.0.0" from node_modules/@storybook/addon-vitest',
            },
          },
        },
      },
    }),
    [
      'eslint@9.39.5 does not satisfy "^10.0.0" from node_modules/@eslint/js',
      'vitest@5.0.1 does not satisfy "^3.0.0 || ^4.0.0" from node_modules/@storybook/addon-vitest',
    ],
  );
});

test("diagnostics retain older npm problem summaries and accept healthy trees", () => {
  assert.deepEqual(
    collectDependencyConflicts({
      problems: [
        "invalid: typescript@6.0.3 /prototype/node_modules/typescript",
        "extraneous: unrelated@1.0.0 /prototype/node_modules/unrelated",
      ],
    }),
    ["invalid: typescript@6.0.3 /prototype/node_modules/typescript"],
  );
  assert.deepEqual(collectDependencyConflicts({}), []);
});
