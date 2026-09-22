import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { configureBundler } from "./bundler.js";
import { mountWidget } from "./layout.js";
import { assertSafePath, exists, inspectProject } from "./project.js";
import { integrationFiles } from "./templates.js";

interface Installation {
  version: 1;
  projectId: string;
  projectName: string;
  appDirectory: string;
  layout: string;
  protected: boolean;
  files: string[];
}

export interface InitOptions {
  cwd: string;
  protect?: boolean;
  dryRun?: boolean;
}

interface Change {
  filename: string;
  content: string;
  previous: string | null;
}

async function readInstallation(root: string): Promise<Installation | null> {
  const filename = path.join(root, ".revisionlab/installation.json");
  await assertSafePath(root, filename);
  if (!(await exists(filename))) return null;
  const value: unknown = JSON.parse(await readFile(filename, "utf8"));
  if (!value || typeof value !== "object")
    throw new Error("Invalid .revisionlab/installation.json.");
  const manifest = value as Installation;
  if (
    manifest.version !== 1 ||
    typeof manifest.projectId !== "string" ||
    typeof manifest.projectName !== "string" ||
    !Array.isArray(manifest.files) ||
    !manifest.files.every((filename) => typeof filename === "string")
  ) {
    throw new Error(
      "Unsupported or invalid .revisionlab/installation.json. Existing files have not been changed.",
    );
  }
  return manifest;
}

async function assertNoReservedRoutes(root: string, app: string) {
  for (const directory of ["revisionlab", "api/revisionlab"]) {
    const filename = path.join(root, app, directory);
    if ((await exists(filename)) && (await readdir(filename)).length) {
      throw new Error(
        `${path.join(app, directory)} already exists. Move the conflicting route before running init.`,
      );
    }
  }
  // Route groups do not contribute URL segments, so inspect their reserved paths too.
  for (const entry of await readdir(path.join(root, app), {
    withFileTypes: true,
  })) {
    if (entry.isDirectory() && /^\(.*\)$/.test(entry.name)) {
      await assertNoReservedRoutes(root, path.join(app, entry.name));
    }
  }
}

async function commit(root: string, changes: Change[]) {
  const completed: Change[] = [];
  try {
    for (const change of changes) {
      const filename = path.join(root, change.filename);
      await assertSafePath(root, filename);
      const current = (await exists(filename))
        ? await readFile(filename, "utf8")
        : null;
      if (current !== change.previous)
        throw new Error(
          `${change.filename} changed while init was running. Try again.`,
        );
      await mkdir(path.dirname(filename), { recursive: true });
      await writeFile(filename, change.content, {
        flag: change.previous === null ? "wx" : "w",
      });
      completed.push(change);
    }
  } catch (error) {
    // Undo only content this invocation wrote, leaving concurrent host edits untouched.
    for (const change of completed.reverse()) {
      const filename = path.join(root, change.filename);
      if ((await readFile(filename, "utf8")) !== change.content) continue;
      if (change.previous === null) await unlink(filename);
      else await writeFile(filename, change.previous);
    }
    throw error;
  }
}

export async function initialize(options: InitOptions) {
  const project = await inspectProject(options.cwd);
  const previous = await readInstallation(project.root);
  if (
    previous &&
    (previous.appDirectory !== project.app ||
      previous.layout !== project.layout)
  ) {
    throw new Error(
      "The app root changed since installation. Move the generated routes and widget integration manually.",
    );
  }
  const protect = options.protect || previous?.protected || false;
  if (
    protect &&
    project.nextMajor === 15 &&
    Number(project.nextVersion.split(".")[1]) < 5
  ) {
    throw new Error(
      "--protect requires Next.js 15.5+ for Node.js middleware, or Next.js 16. Upgrade Next.js or omit --protect.",
    );
  }
  if (!previous) await assertNoReservedRoutes(project.root, project.app);
  if (protect) {
    const expected = `${project.app === "src/app" ? "src/" : ""}${project.nextMajor >= 16 ? "proxy" : "middleware"}.${project.typescript ? "ts" : "js"}`;
    for (const prefix of ["", "src/"]) {
      for (const stem of ["proxy", "middleware"]) {
        for (const extension of ["ts", "js", "mjs"]) {
          const filename = `${prefix}${stem}.${extension}`;
          if (
            (await exists(path.join(project.root, filename))) &&
            !(
              previous?.protected &&
              previous.files.includes(filename) &&
              filename === expected
            )
          ) {
            throw new Error(
              `${filename} already exists. Integrate protectRevisionLab into it manually; init will not replace your access rules.`,
            );
          }
        }
      }
    }
  }
  const projectId = previous?.projectId ?? randomUUID();
  project.name = previous?.projectName ?? project.name;
  const files = integrationFiles(project, projectId, protect);
  const changes: Change[] = [];
  const retained: string[] = [];
  const packagePath = path.join(project.root, "package.json");
  await assertSafePath(project.root, packagePath);
  const originalPackage = await readFile(packagePath, "utf8");
  const bundler = configureBundler(originalPackage, project.nextMajor);
  if (bundler.content !== originalPackage) {
    const backup = ".revisionlab/backups/package.json";
    await assertSafePath(project.root, path.join(project.root, backup));
    if (!(await exists(path.join(project.root, backup))))
      changes.push({
        filename: backup,
        content: originalPackage,
        previous: null,
      });
    changes.push({
      filename: "package.json",
      content: bundler.content,
      previous: originalPackage,
    });
  }
  for (const [filename, content] of Object.entries(files)) {
    const absolute = path.join(project.root, filename);
    await assertSafePath(project.root, absolute);
    const current = (await exists(absolute))
      ? await readFile(absolute, "utf8")
      : null;
    if (current === content) continue;
    if (current !== null) {
      if (previous?.files.includes(filename)) {
        retained.push(filename);
        continue;
      }
      throw new Error(
        `${filename} already exists and differs from the generated file. Nothing has been changed.`,
      );
    }
    changes.push({ filename, content, previous: null });
  }
  const otherConfig = `revisionlab.config.${project.typescript ? "js" : "ts"}`;
  if (await exists(path.join(project.root, otherConfig)))
    throw new Error(
      `${otherConfig} already exists. Resolve the conflicting config before initialization.`,
    );
  const layoutPath = path.join(project.root, project.layout);
  await assertSafePath(project.root, layoutPath);
  const originalLayout = await readFile(layoutPath, "utf8");
  const updatedLayout = mountWidget(originalLayout, project.layout);
  if (updatedLayout !== originalLayout) {
    const backup = `.revisionlab/backups/${project.layout}`;
    await assertSafePath(project.root, path.join(project.root, backup));
    if (!(await exists(path.join(project.root, backup))))
      changes.push({
        filename: backup,
        content: originalLayout,
        previous: null,
      });
    changes.push({
      filename: project.layout,
      content: updatedLayout,
      previous: originalLayout,
    });
  }
  const manifest: Installation = {
    version: 1,
    projectId,
    projectName: project.name,
    appDirectory: project.app,
    layout: project.layout,
    protected: protect,
    files: Object.keys(files),
  };
  const manifestName = ".revisionlab/installation.json";
  const currentManifest = (await exists(path.join(project.root, manifestName)))
    ? await readFile(path.join(project.root, manifestName), "utf8")
    : null;
  const content = `${JSON.stringify(manifest, null, 2)}\n`;
  if (content !== currentManifest)
    changes.push({
      filename: manifestName,
      content,
      previous: currentManifest,
    });
  if (!options.dryRun) await commit(project.root, changes);
  return {
    project,
    changed: changes.map((change) => change.filename),
    retained,
    protected: protect,
    warnings: bundler.warnings,
    updatedScripts: bundler.updatedScripts,
  };
}
