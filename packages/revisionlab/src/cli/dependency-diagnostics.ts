import { spawnSync } from "node:child_process";
import path from "node:path";
import { exists } from "./project.js";

interface DependencyNode {
  version?: string;
  invalid?: string;
  problems?: string[];
  dependencies?: Record<string, DependencyNode>;
}

export function collectDependencyConflicts(tree: DependencyNode): string[] {
  const conflicts = new Set<string>();
  const pending = [tree];
  const described = new Set<string>();
  while (pending.length) {
    const node = pending.pop()!;
    for (const [name, dependency] of Object.entries(node.dependencies ?? {})) {
      if (typeof dependency.invalid === "string") {
        const label = `${name}@${dependency.version ?? "unknown"}`;
        conflicts.add(`${label} does not satisfy ${dependency.invalid}`);
        described.add(label);
      }
      pending.push(dependency);
    }
  }
  // Older npm versions can expose a problem without annotating its tree node.
  for (const problem of tree.problems ?? []) {
    if (
      problem.startsWith("invalid: ") &&
      ![...described].some((label) => problem.startsWith(`invalid: ${label} `))
    ) {
      conflicts.add(problem);
    }
  }
  return [...conflicts].sort();
}

export async function diagnoseDependencies(root: string): Promise<string> {
  const instructions =
    "Update all conflicting declarations together in package.json before installing again. A single-package npm install can fail on another conflict before saving its repair.\nAfter editing, rerun the exact install command below, then run npm ls --all before starting development.";
  if (!(await exists(path.join(root, "node_modules")))) {
    return `Dependency diagnosis: no installed dependency tree is available. Use the package versions and required peer ranges in npm's error above.\n${instructions}`;
  }
  const result = spawnSync(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["ls", "--all", "--json"],
    {
      cwd: root,
      encoding: "utf8",
      shell: false,
      timeout: 10_000,
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  if (result.error) {
    return `Dependency diagnosis could not complete. Run npm ls --all to inspect the installed tree.\n${instructions}`;
  }
  let conflicts: string[];
  try {
    const tree = JSON.parse(result.stdout) as DependencyNode | null;
    if (!tree || typeof tree !== "object") throw new Error("Invalid tree");
    conflicts = collectDependencyConflicts(tree);
  } catch {
    return `Dependency diagnosis could not read npm's report. Run npm ls --all to inspect the installed tree.\n${instructions}`;
  }
  if (!conflicts.length) {
    return `Dependency diagnosis: npm ls found no annotated version conflicts in the installed tree. The failed install may require different versions; use npm's original error above.\n${instructions}`;
  }
  return [
    "Installed dependency conflicts (including transitive dependencies):",
    ...conflicts.slice(0, 20).map((conflict) => `  - ${conflict}`),
    conflicts.length > 20
      ? `  ${conflicts.length - 20} more conflicts; run npm ls --all for the full report.`
      : "",
    "These are installed versions; npm's original install error may describe additional resolution constraints.",
    instructions,
  ]
    .filter(Boolean)
    .join("\n");
}
