import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
  lstat,
  readFile,
  realpath,
  rename,
  rm,
  writeFile,
} from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { promisify } from "node:util";
import ts from "typescript";
import type { ProposedChange } from "../../review-automation.js";
import { HttpError } from "../security.js";

const exec = promisify(execFile);
const extensions = /\.(?:tsx?|jsx?|mjs|cjs|css|scss|html|vue|svelte)$/i;
export interface SourceSnapshot {
  file: string;
  original: string;
  updated: string;
}

async function writeSource(path: string, content: string) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  try {
    const { mode } = await lstat(path);
    await writeFile(temporary, content, { mode, flag: "wx" });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true }).catch(() => undefined);
  }
}

export async function sourceFile(root: string, file: string) {
  if (
    isAbsolute(file) ||
    file.includes("\\") ||
    file
      .split("/")
      .some((part) => part.startsWith(".") || part === "node_modules") ||
    !extensions.test(file)
  )
    throw new HttpError(
      400,
      "Codex may only change source files within this project.",
    );
  const absolute = resolve(root, file);
  if (
    relative(root, absolute).startsWith(`..${sep}`) ||
    (await realpath(absolute)) !== absolute
  )
    throw new HttpError(
      400,
      "Changes outside the project or through symbolic links are not supported.",
    );
  const stat = await lstat(absolute);
  if (!stat.isFile() || stat.size > 500_000)
    throw new HttpError(
      400,
      "The proposed source file is unsupported or too large.",
    );
  return absolute;
}

export async function prepareChanges(
  root: string,
  changes: ProposedChange[],
): Promise<SourceSnapshot[]> {
  const { stdout } = await exec(
    "git",
    ["ls-files", "-co", "--exclude-standard", "-z"],
    { cwd: root, maxBuffer: 4_000_000 },
  );
  const allowed = new Set(stdout.split("\0"));
  const snapshots: SourceSnapshot[] = [];
  for (const change of changes) {
    if (
      !allowed.has(change.file) ||
      snapshots.some((item) => item.file === change.file)
    )
      throw new HttpError(
        400,
        "Each change must name a distinct, nonignored project source file.",
      );
    const absolute = await sourceFile(root, change.file);
    const original = await readFile(absolute, "utf8");
    if (!change.before || original.split(change.before).length !== 2)
      throw new HttpError(
        409,
        `The proposed change does not uniquely match ${change.file}. Run Codex again.`,
      );
    const updated = original.replace(change.before, () => change.after);
    if (updated === original) continue;
    if (/\.[cm]?[jt]sx?$/i.test(change.file)) {
      const result = ts.transpileModule(updated, {
        fileName: change.file,
        reportDiagnostics: true,
        compilerOptions: {
          jsx: ts.JsxEmit.Preserve,
          target: ts.ScriptTarget.ESNext,
        },
      });
      if (
        result.diagnostics?.some(
          (item) => item.category === ts.DiagnosticCategory.Error,
        )
      )
        throw new HttpError(
          400,
          `The proposed change contains syntax errors in ${change.file}.`,
        );
    }
    snapshots.push({ file: change.file, original, updated });
  }
  return snapshots;
}

// Validate the entire batch first. Never overwrite edits made since the preview/apply.
export async function replaceSources(
  root: string,
  snapshots: SourceSnapshot[],
  undo: boolean,
) {
  for (const item of snapshots) {
    const path = await sourceFile(root, item.file);
    if (
      (await readFile(path, "utf8")) !== (undo ? item.updated : item.original)
    )
      throw new HttpError(
        409,
        `${item.file} has changed. Your local edits were preserved; generate a new fix.`,
      );
  }
  const written: SourceSnapshot[] = [];
  try {
    for (const item of snapshots) {
      const path = await sourceFile(root, item.file);
      if (
        (await readFile(path, "utf8")) !== (undo ? item.updated : item.original)
      )
        throw new HttpError(
          409,
          `${item.file} changed while applying the fix.`,
        );
      await writeSource(path, undo ? item.original : item.updated);
      written.push(item);
    }
  } catch (error) {
    for (const item of written.reverse()) {
      const path = await sourceFile(root, item.file);
      if (
        (await readFile(path, "utf8")) === (undo ? item.original : item.updated)
      )
        await writeSource(path, undo ? item.updated : item.original);
    }
    throw error;
  }
}
