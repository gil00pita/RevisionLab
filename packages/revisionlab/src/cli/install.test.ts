import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import {
  chmod,
  mkdtemp,
  mkdir,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";
import type { TestContext } from "node:test";
import { initialize } from "./install.js";
import { mountWidget } from "./layout.js";
import { exists } from "./project.js";

async function fixture(
  t: TestContext,
  options: {
    app?: string;
    extension?: string;
    next?: string;
    react?: string;
  } = {},
) {
  const root = await mkdtemp(path.join(os.tmpdir(), "revisionlab-init-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const app = options.app ?? "src/app";
  const extension = options.extension ?? "tsx";
  await mkdir(path.join(root, app), { recursive: true });
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "team-prototype",
      scripts: { dev: "next dev", build: "next build", lint: "eslint" },
      dependencies: {
        next: options.next ?? "16.3.5",
        react: options.react ?? "19.2.8",
        "react-dom": options.react ?? "19.2.8",
      },
    }),
  );
  const layout = `import { HostProvider } from "./provider";\n\nexport default function RootLayout({ children }) {\n  return <html><body><HostProvider>{children}</HostProvider></body></html>;\n}\n`;
  await writeFile(path.join(root, app, `layout.${extension}`), layout);
  return { root, app, extension, layout };
}

test("initializes real route integrations, preserves the host provider, and is idempotent", async (t) => {
  const project = await fixture(t);
  const first = await initialize({ cwd: project.root });
  assert.ok(
    first.changed.includes("src/app/api/revisionlab/[...path]/route.ts"),
  );
  const layout = await readFile(
    path.join(project.root, "src/app/layout.tsx"),
    "utf8",
  );
  assert.match(
    layout,
    /<HostProvider>\{children\}<\/HostProvider><RevisionLabEmbeddedWidget \/>/,
  );
  assert.equal(
    await readFile(
      path.join(project.root, ".revisionlab/backups/src/app/layout.tsx"),
      "utf8",
    ),
    project.layout,
  );
  const route = await readFile(
    path.join(project.root, "src/app/api/revisionlab/[...path]/route.ts"),
    "utf8",
  );
  assert.match(
    route,
    /from "\.\.\/\.\.\/\.\.\/\.\.\/\.\.\/revisionlab.config"/,
  );
  assert.match(route, /runtime = "nodejs"/);
  const manifest = JSON.parse(
    await readFile(path.join(project.root, "package.json"), "utf8"),
  );
  assert.equal(manifest.scripts.dev, "next dev --webpack");
  assert.equal(manifest.scripts.build, "next build --webpack");
  const backup = JSON.parse(
    await readFile(
      path.join(project.root, ".revisionlab/backups/package.json"),
      "utf8",
    ),
  );
  assert.equal(backup.scripts.dev, "next dev");
  assert.equal((await initialize({ cwd: project.root })).changed.length, 0);
});

test("preserves edits to generated files on repeat initialization", async (t) => {
  const project = await fixture(t);
  await initialize({ cwd: project.root });
  const filename = "src/app/revisionlab/page.tsx";
  await writeFile(
    path.join(project.root, filename),
    "// Host-owned customization\n",
  );
  const result = await initialize({ cwd: project.root });
  assert.deepEqual(result.retained, [filename]);
  assert.equal(
    await readFile(path.join(project.root, filename), "utf8"),
    "// Host-owned customization\n",
  );
});

test("generates JavaScript routes and Next 15 Node middleware", async (t) => {
  const project = await fixture(t, {
    app: "app",
    extension: "js",
    next: "15.5.0",
  });
  await initialize({ cwd: project.root, protect: true });
  const middleware = await readFile(
    path.join(project.root, "middleware.js"),
    "utf8",
  );
  assert.match(middleware, /function middleware\(request\)/);
  assert.match(middleware, /runtime: "nodejs"/);
  assert.equal(
    await exists(path.join(project.root, "app/revisionlab/page.jsx")),
    true,
  );
  assert.equal(
    await exists(path.join(project.root, "revisionlab.config.js")),
    true,
  );
});

test("can add Next 16 protection after the first initialization", async (t) => {
  const project = await fixture(t);
  await initialize({ cwd: project.root });
  const result = await initialize({ cwd: project.root, protect: true });
  assert.ok(result.changed.includes("src/proxy.ts"));
  const proxy = await readFile(path.join(project.root, "src/proxy.ts"), "utf8");
  assert.match(proxy, /protectRevisionLab/);
  assert.doesNotMatch(proxy, /runtime:/);
  assert.equal((await initialize({ cwd: project.root })).changed.length, 0);
});

test("conflicts abort before the layout or other files are changed", async (t) => {
  const project = await fixture(t);
  await writeFile(
    path.join(project.root, "revisionlab.config.ts"),
    "// Existing config\n",
  );
  await assert.rejects(initialize({ cwd: project.root }), /already exists/);
  assert.equal(
    await readFile(path.join(project.root, "src/app/layout.tsx"), "utf8"),
    project.layout,
  );
  assert.equal(await exists(path.join(project.root, ".revisionlab")), false);
  const manifest = JSON.parse(
    await readFile(path.join(project.root, "package.json"), "utf8"),
  );
  assert.equal(manifest.scripts.dev, "next dev");
});

test("protect never replaces an existing middleware or proxy", async (t) => {
  const project = await fixture(t);
  await writeFile(
    path.join(project.root, "src/middleware.ts"),
    "// Existing authorization\n",
  );
  await assert.rejects(
    initialize({ cwd: project.root, protect: true }),
    /already exists/,
  );
  assert.equal(
    await exists(path.join(project.root, "revisionlab.config.ts")),
    false,
  );
});

test("rejects reserved routes hidden inside a route group", async (t) => {
  const project = await fixture(t);
  await mkdir(path.join(project.root, "src/app/(private)/revisionlab"), {
    recursive: true,
  });
  await writeFile(
    path.join(project.root, "src/app/(private)/revisionlab/page.tsx"),
    "export default function Page() {}\n",
  );
  await assert.rejects(initialize({ cwd: project.root }), /already exists/);
});

test("a Next major upgrade cannot silently create competing access guards", async (t) => {
  const project = await fixture(t, { next: "15.5.0" });
  await initialize({ cwd: project.root, protect: true });
  const filename = path.join(project.root, "package.json");
  const manifest = JSON.parse(await readFile(filename, "utf8"));
  manifest.dependencies.next = "16.3.5";
  await writeFile(filename, JSON.stringify(manifest));
  await assert.rejects(
    initialize({ cwd: project.root, protect: true }),
    /middleware.ts already exists/,
  );
  assert.equal(await exists(path.join(project.root, "src/proxy.ts")), false);
});

test("does not write through a symbolic link", async (t) => {
  const project = await fixture(t);
  const other = await mkdtemp(path.join(os.tmpdir(), "revisionlab-unrelated-"));
  t.after(() => rm(other, { recursive: true, force: true }));
  await symlink(other, path.join(project.root, ".revisionlab"), "dir");
  await assert.rejects(initialize({ cwd: project.root }), /symbolic link/);
  assert.equal(await exists(path.join(other, "installation.json")), false);
});

test("rejects unsupported React, old protection runtimes, and static exports", async (t) => {
  const oldReact = await fixture(t, { react: "18.3.1" });
  await assert.rejects(initialize({ cwd: oldReact.root }), /React 19/);
  const oldNext = await fixture(t, { next: "15.4.0" });
  await assert.rejects(
    initialize({ cwd: oldNext.root, protect: true }),
    /15.5/,
  );
  const staticExport = await fixture(t);
  await writeFile(
    path.join(staticExport.root, "next.config.js"),
    'export default { output: "export" };\n',
  );
  await assert.rejects(initialize({ cwd: staticExport.root }), /static export/);
});

test("dry-run validates the integration without writing anything", async (t) => {
  const project = await fixture(t);
  const result = await initialize({ cwd: project.root, dryRun: true });
  assert.ok(result.changed.length > 0);
  assert.equal(await exists(path.join(project.root, ".revisionlab")), false);
  assert.equal(
    await readFile(path.join(project.root, "src/app/layout.tsx"), "utf8"),
    project.layout,
  );
  const manifest = JSON.parse(
    await readFile(path.join(project.root, "package.json"), "utf8"),
  );
  assert.equal(manifest.scripts.dev, "next dev");
  assert.ok(result.changed.includes("package.json"));
});

test("CLI --no-install completes without running npm and reports invalid flags", async (t) => {
  const project = await fixture(t);
  const cli = fileURLToPath(new URL("./index.js", import.meta.url));
  const result = spawnSync(
    process.execPath,
    [cli, "init", "--cwd", project.root, "--no-install"],
    {
      encoding: "utf8",
      env: { ...process.env, PATH: "" },
    },
  );
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Initialized RevisionLab/);
  assert.equal(await exists(path.join(project.root, "node_modules")), false);
  const invalid = spawnSync(process.execPath, [cli, "init", "--wat"], {
    encoding: "utf8",
  });
  assert.equal(invalid.status, 1);
  assert.match(invalid.stderr, /Unknown option/);
});

for (const override of [undefined, "revisionlab@next", "./local build.tgz"]) {
  test(
    `CLI installs ${override ?? "its own exact package version"} without contacting npm`,
    { skip: process.platform === "win32" },
    async (t) => {
      const project = await fixture(t);
      const bin = path.join(project.root, "test-bin");
      await mkdir(bin);
      const npm = path.join(bin, "npm");
      await writeFile(
        npm,
        `#!${process.execPath}\nconsole.log("NPM_ARGUMENTS=" + JSON.stringify(process.argv.slice(2)));\n`,
      );
      await chmod(npm, 0o755);
      const cli = fileURLToPath(new URL("./index.js", import.meta.url));
      const manifest = JSON.parse(
        await readFile(new URL("../../package.json", import.meta.url), "utf8"),
      );
      const expected = override
        ? override.startsWith(".")
          ? path.resolve(override)
          : override
        : `${manifest.name}@${manifest.version}`;
      const result = spawnSync(
        process.execPath,
        [
          cli,
          "init",
          "--cwd",
          project.root,
          ...(override ? ["--package", override] : []),
        ],
        { encoding: "utf8", env: { ...process.env, PATH: bin } },
      );
      assert.equal(result.status, 0, result.stderr);
      const captured = result.stdout.match(/NPM_ARGUMENTS=(.+)/);
      assert.ok(captured, result.stdout);
      assert.deepEqual(JSON.parse(captured[1]), ["install", expected]);
      assert.equal(
        await exists(path.join(project.root, "node_modules")),
        false,
      );
    },
  );
}

test("layout parser preserves directives and ignores body-like text in strings", () => {
  const source =
    '"use client";\nconst label = "</body>";\nexport default function Root({children}) { return <html><body>{children}</body></html>; }\n';
  const result = mountWidget(source, "layout.jsx");
  assert.ok(result.startsWith('"use client";'));
  assert.match(result, /const label = "<\/body>"/);
  assert.equal(mountWidget(result, "layout.jsx"), result);
  assert.throws(
    () =>
      mountWidget(
        "export default function Root() { return <CustomDocument />; }",
        "layout.tsx",
      ),
    /expected one native/,
  );
});
