import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type {
  CodexProposal,
  FeedbackContext,
} from "../../review-automation.js";
import { HttpError } from "../security.js";
import type { SourceSnapshot } from "./source-files.js";

export interface StoredProposal extends CodexProposal {
  projectId: string;
  context: FeedbackContext;
  sources: SourceSnapshot[];
  prUrl?: string;
}

// Retain the guard across Next.js development module reloads.
const runtime = globalThis as typeof globalThis & {
  revisionLabAiLocks?: Set<string>;
};
const locks = (runtime.revisionLabAiLocks ??= new Set<string>());
export async function withProjectLock<T>(
  root: string,
  operation: () => Promise<T>,
) {
  if (locks.has(root))
    throw new HttpError(
      409,
      "An AI operation is already running for this project. Wait for it to finish.",
    );
  locks.add(root);
  try {
    return await operation();
  } finally {
    locks.delete(root);
  }
}
export async function saveProposal(root: string, proposal: StoredProposal) {
  const directory = join(root, ".revisionlab", "ai-fixes");
  await mkdir(directory, { recursive: true });
  const temporary = join(directory, `${proposal.id}.${randomUUID()}.tmp`);
  try {
    await writeFile(temporary, JSON.stringify(proposal), {
      mode: 0o600,
      flag: "wx",
    });
    await rename(temporary, join(directory, `${proposal.id}.json`));
  } finally {
    await rm(temporary, { force: true }).catch(() => undefined);
  }
}
export async function readProposal(
  root: string,
  id: string,
  projectId: string,
): Promise<StoredProposal> {
  let proposal: StoredProposal;
  try {
    proposal = JSON.parse(
      await readFile(
        join(root, ".revisionlab", "ai-fixes", `${id}.json`),
        "utf8",
      ),
    );
  } catch {
    throw new HttpError(
      404,
      "This AI fix is no longer available. Generate a new one.",
    );
  }
  if (proposal.projectId !== projectId || proposal.id !== id)
    throw new HttpError(404, "AI fix not found.");
  return proposal;
}
export function publicProposal({
  id,
  summary,
  changes,
  warnings,
  status,
  prUrl,
}: StoredProposal) {
  return { id, summary, changes, warnings, status, prUrl };
}
