import { execFile } from "node:child_process";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { HttpError } from "../security.js";
import type { StoredProposal } from "./proposals.js";
import { prepareChanges, replaceSources } from "./source-files.js";

const exec = promisify(execFile);
export async function createFixPullRequest(
  root: string,
  proposal: StoredProposal,
) {
  const run = (command: string, args: string[], cwd = root) =>
    exec(command, args, { cwd, timeout: 90_000, maxBuffer: 1_000_000 });
  try {
    await run("gh", ["auth", "status"]);
  } catch {
    throw new HttpError(
      503,
      "Install GitHub CLI and run gh auth login locally to create a draft PR.",
    );
  }
  const branch = `revisionlab/fix-${proposal.id}`;
  // Recover a successful PR creation if the previous response was interrupted.
  const existing = await run("gh", [
    "pr",
    "list",
    "--head",
    branch,
    "--state",
    "all",
    "--json",
    "url",
    "--jq",
    ".[0].url",
  ]).catch(() => null);
  if (existing?.stdout.trim().startsWith("https://github.com/"))
    return existing.stdout.trim();
  const { stdout } = await run("gh", [
    "repo",
    "view",
    "--json",
    "defaultBranchRef",
    "--jq",
    ".defaultBranchRef.name",
  ]);
  const base = stdout.trim();
  if (!base || base.startsWith("-"))
    throw new HttpError(503, "Could not determine the GitHub default branch.");
  await run("git", ["fetch", "origin", base]);
  const temporary = await mkdtemp(join(tmpdir(), "revisionlab-pr-"));
  const checkout = join(temporary, "project");
  let added = false;
  try {
    await run("git", [
      "worktree",
      "add",
      "--detach",
      checkout,
      `refs/remotes/origin/${base}`,
    ]);
    added = true;
    for (const source of proposal.sources) {
      const baseline = await readFile(
        join(checkout, source.file),
        "utf8",
      ).catch(() => null);
      if (baseline !== source.original)
        throw new HttpError(
          409,
          `${source.file} differs from ${base}. The draft PR was not created. Merge the required baseline changes and generate a new fix.`,
        );
    }
    const canonicalCheckout = await realpath(checkout);
    const snapshots = await prepareChanges(canonicalCheckout, proposal.changes);
    await replaceSources(canonicalCheckout, snapshots, false);
    await run(
      "git",
      ["add", "--", ...snapshots.map((source) => source.file)],
      checkout,
    );
    await run(
      "git",
      [
        "-c",
        "core.hooksPath=/dev/null",
        "commit",
        "-m",
        `Fix review feedback: ${proposal.context.screen}`,
      ],
      checkout,
    );
    await run("git", ["push", "origin", `HEAD:refs/heads/${branch}`], checkout);
    const body = join(temporary, "pr.md");
    await writeFile(
      body,
      `${proposal.summary}\n\nSource: ${proposal.context.flowName}, version ${proposal.context.version}, screen ${proposal.context.screen} (${proposal.context.route}).\n\nGenerated from selected RevisionLab feedback with local Codex. Historical comments and accessibility reports remain unchanged.\n\nValidation: exact source match and JavaScript/TypeScript syntax checks where applicable. Full project tests and a fresh accessibility scan still need to be run.\n\n${proposal.warnings.map((warning) => `- ${warning}`).join("\n")}\n`,
    );
    const result = await run(
      "gh",
      [
        "pr",
        "create",
        "--draft",
        "--base",
        base,
        "--head",
        branch,
        "--title",
        `Fix review feedback: ${proposal.context.screen}`.slice(0, 200),
        "--body-file",
        body,
      ],
      checkout,
    );
    const url = result.stdout.trim();
    if (!url.startsWith("https://github.com/"))
      throw new Error("Missing PR URL");
    return url;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(
      503,
      `Could not create the draft PR. Check Git/GitHub authentication and the origin remote. If the push succeeded, branch ${branch} is available on GitHub.`,
    );
  } finally {
    if (added)
      await run("git", ["worktree", "remove", "--force", checkout]).catch(
        () => undefined,
      );
    await rm(temporary, { recursive: true, force: true });
  }
}
