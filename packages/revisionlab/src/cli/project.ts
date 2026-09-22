import { access, lstat, readFile, realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

export interface Project {
  root: string;
  app: string;
  layout: string;
  typescript: boolean;
  name: string;
  nextVersion: string;
  nextMajor: number;
}

export async function exists(filename: string): Promise<boolean> {
  try {
    await access(filename);
    return true;
  } catch {
    return false;
  }
}

export async function assertSafePath(root: string, filename: string) {
  const relative = path.relative(root, filename);
  if (relative.startsWith("..") || path.isAbsolute(relative))
    throw new Error("Output must remain inside the selected project.");
  let cursor = root;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    try {
      if ((await lstat(cursor)).isSymbolicLink())
        throw new Error(`Refusing to modify a symbolic link: ${cursor}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
}

function dependencyVersion(
  root: string,
  name: string,
  declared: string | undefined,
): string {
  if (!declared)
    throw new Error(`This project must declare ${name} in package.json.`);
  try {
    const require = createRequire(path.join(root, "package.json"));
    return (require(`${name}/package.json`) as { version: string }).version;
  } catch {
    const version = declared.match(/^[~^]?(\d+\.\d+(?:\.\d+)?)/)?.[1];
    if (!version)
      throw new Error(
        `Cannot determine ${name}'s version. Install your project dependencies first.`,
      );
    return version;
  }
}

export async function inspectProject(directory: string): Promise<Project> {
  const root = await realpath(path.resolve(directory));
  let manifest: {
    name?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  try {
    manifest = JSON.parse(
      await readFile(path.join(root, "package.json"), "utf8"),
    );
  } catch {
    throw new Error(
      `No readable package.json found in ${root}. Run init inside an existing Next.js project.`,
    );
  }
  const dependencies = {
    ...manifest.devDependencies,
    ...manifest.dependencies,
  };
  const nextVersion = dependencyVersion(root, "next", dependencies.next);
  const nextMajor = Number(nextVersion.split(".")[0]);
  if (nextMajor < 15 || nextMajor > 16)
    throw new Error(
      "RevisionLab currently supports Next.js 15 and 16 App Router projects.",
    );
  for (const name of ["react", "react-dom"]) {
    if (
      Number(
        dependencyVersion(root, name, dependencies[name]).split(".")[0],
      ) !== 19
    ) {
      throw new Error(`RevisionLab currently requires React 19 (${name}).`);
    }
  }
  const candidates = (
    await Promise.all(
      ["app", "src/app"].map(async (candidate) =>
        (await exists(path.join(root, candidate))) ? candidate : null,
      ),
    )
  ).filter((value): value is string => !!value);
  if (candidates.length !== 1)
    throw new Error(
      "Expected exactly one app/ or src/app/ directory. Pages Router and multiple app roots are not supported.",
    );
  const app = candidates[0];
  const layouts = (
    await Promise.all(
      ["tsx", "jsx", "js"].map(async (extension) => {
        const candidate = path.join(app, `layout.${extension}`);
        return (await exists(path.join(root, candidate))) ? candidate : null;
      }),
    )
  ).filter((value): value is string => !!value);
  if (layouts.length !== 1)
    throw new Error(
      `Expected one root layout in ${app}/layout.tsx, layout.jsx, or layout.js.`,
    );
  for (const config of [
    "next.config.ts",
    "next.config.mjs",
    "next.config.js",
  ]) {
    if (!(await exists(path.join(root, config)))) continue;
    const text = await readFile(path.join(root, config), "utf8");
    if (
      /\bpageExtensions\s*:|\bbasePath\s*:|\boutput\s*:\s*["']export["']/.test(
        text,
      )
    ) {
      throw new Error(
        "Automatic setup does not yet support custom pageExtensions, a Next.js basePath, or static export. Use the manual integration in RevisionLab's README.",
      );
    }
  }
  return {
    root,
    app,
    layout: layouts[0],
    typescript: layouts[0].endsWith(".tsx"),
    nextVersion,
    nextMajor,
    name: manifest.name?.replace(/^@[^/]+\//, "") ?? path.basename(root),
  };
}
