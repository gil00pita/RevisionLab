#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { initialize } from "./install.js";
import { resolvePackageSpec } from "./package-spec.js";

const help = `RevisionLab — embedded prototype review for Next.js

Usage: npx revisionlab init [options]

  --cwd <directory>   Existing Next.js App Router project (default: current directory)
  --no-install        Generate integration files without running npm install
  --package <spec>    Override this CLI's version with an npm package spec or local .tgz
  --protect           Gate prototype routes with RevisionLab invitations
  --dry-run           Show planned file changes without writing or installing
  --help              Show this help

Requires Next.js 15/16, React 19, and Node.js 20.9+. --protect needs Next.js 15.5+.
Existing conflicting files are never overwritten. Re-running init preserves your edits.
Conventional Next.js dev/build scripts are adapted to Webpack for Chakra compatibility.
`;

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(help);
    return;
  }
  if (args.shift() !== "init")
    throw new Error(
      "Expected the init command. Run revisionlab --help for usage.",
    );
  let cwd = process.cwd();
  let install = true;
  let protect = false;
  let dryRun = false;
  let packageOverride: string | undefined;
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (argument === "--no-install") install = false;
    else if (argument === "--protect") protect = true;
    else if (argument === "--dry-run") dryRun = true;
    else if (argument === "--cwd" || argument === "--package") {
      const value = args[++index];
      if (!value || value.startsWith("-"))
        throw new Error(`${argument} requires a value.`);
      if (argument === "--cwd") cwd = path.resolve(value);
      else packageOverride = value;
    } else
      throw new Error(
        `Unknown option: ${argument}. Run revisionlab --help for usage.`,
      );
  }
  const [major, minor] = process.versions.node.split(".").map(Number);
  if (major < 20 || (major === 20 && minor < 9))
    throw new Error("RevisionLab requires Node.js 20.9 or newer.");
  const packageSpec = await resolvePackageSpec(packageOverride);
  const result = await initialize({ cwd, protect, dryRun });
  console.log(
    `${dryRun ? "Planned" : "Initialized"} RevisionLab in ${result.project.root}`,
  );
  for (const filename of result.changed)
    console.log(`  ${dryRun ? "write" : "wrote"} ${filename}`);
  for (const filename of result.retained)
    console.log(`  kept your changes to ${filename}`);
  for (const warning of result.warnings) console.warn(`  ${warning}`);
  if (result.updatedScripts.length)
    console.log(
      `  ${dryRun ? "will use" : "using"} Webpack for: ${result.updatedScripts.join(", ")}`,
    );
  if (!result.changed.length)
    console.log("  Integration is already installed.");
  if (install && !dryRun) {
    const child = spawnSync(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["install", packageSpec],
      {
        cwd: result.project.root,
        stdio: "inherit",
        shell: false,
      },
    );
    if (child.error || child.status !== 0) {
      throw new Error(
        "Files are ready, but npm install failed. Run npm install with your RevisionLab package spec, then start the app.",
      );
    }
  }
  if (dryRun) return;
  console.log(
    `\n${install ? "Run your development server" : `Install ${packageSpec}, then run your development server`} and visit /revisionlab.`,
  );
  console.log(
    "Local data is saved in .revisionlab/revisionlab.db. Modified host files are backed up in .revisionlab/backups/.",
  );
  console.log(
    result.protected
      ? "Prototype routes are gated. Configure your owner email and email delivery before deploying."
      : "Review data requires authentication in production. Add --protect to also gate the host prototype routes.",
  );
}

main().catch((error: unknown) => {
  console.error(
    `RevisionLab: ${error instanceof Error ? error.message : "Initialization failed."}`,
  );
  process.exitCode = 1;
});
