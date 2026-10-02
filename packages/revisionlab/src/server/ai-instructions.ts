import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { z } from "zod";
import {
  AI_INSTRUCTIONS_MAX_LENGTH,
  type RevisionLabAiInstructions,
} from "../ai-instructions.js";
import { requireRole } from "./authentication.js";
import type { ResolvedConfig } from "./config.js";
import { HttpError, json, readJson } from "./security.js";
import type { RevisionLabActor } from "./types.js";

const instructionsSchema = z
  .object({
    instructions: z.string().max(AI_INSTRUCTIONS_MAX_LENGTH),
  })
  .strict();

export async function handleAiInstructions(
  request: Request,
  config: ResolvedConfig,
  actor: RevisionLabActor,
) {
  const filePath = resolve(
    config.aiInstructionsFile ?? ".revisionlab/ai-instructions.md",
  );
  if (!filePath.toLowerCase().endsWith(".md"))
    throw new HttpError(
      503,
      "Configure an AI instructions file ending in .md.",
    );

  if (request.method === "GET") {
    let instructions = "";
    try {
      instructions = await readFile(filePath, "utf8");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT")
        throw new HttpError(
          503,
          "Could not read the AI instructions file. Check the server's file permissions and retry.",
        );
    }
    return json({ instructions, filePath } satisfies RevisionLabAiInstructions);
  }

  requireRole(actor, "editor");
  if (request.method !== "PATCH") throw new HttpError(404, "Not found.");
  const { instructions } = instructionsSchema.parse(
    await readJson(request, 200_000),
  );
  const temporaryPath = `${filePath}.${randomUUID()}.tmp`;
  try {
    await mkdir(dirname(filePath), { recursive: true });
    // Rename within the same directory so readers never see a partial save.
    await writeFile(temporaryPath, instructions, { flag: "wx", mode: 0o600 });
    await rename(temporaryPath, filePath);
  } catch {
    throw new HttpError(
      503,
      "Could not save the AI instructions file. Check that the server has writable local storage and retry.",
    );
  } finally {
    await rm(temporaryPath, { force: true }).catch(() => undefined);
  }
  return json({ instructions, filePath } satisfies RevisionLabAiInstructions);
}
