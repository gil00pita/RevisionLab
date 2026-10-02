import type { Client } from "@libsql/client";
import { randomUUID } from "node:crypto";
import { readFile, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import { feedbackContext } from "../../review-automation.js";
import { requireRole } from "../authentication.js";
import type { ResolvedConfig } from "../config.js";
import { consumeRateLimit } from "../database.js";
import { readComments, readFlows } from "../queries.js";
import { HttpError, isLoopback, json, readJson } from "../security.js";
import type { RevisionLabActor } from "../types.js";
import { codexPrompt, runCodex } from "./codex.js";
import { prepareChanges, replaceSources } from "./source-files.js";
import {
  publicProposal,
  readProposal,
  saveProposal,
  withProjectLock,
  type StoredProposal,
} from "./proposals.js";
import { createFixPullRequest } from "./pull-request.js";
import { screenImage } from "./screenshot.js";

const requestSchema = z
  .object({
    flowId: z.string().uuid(),
    stepId: z.string().uuid(),
    target: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("screen") }).strict(),
      z
        .object({ kind: z.literal("comment"), commentId: z.string().uuid() })
        .strict(),
      z
        .object({
          kind: z.literal("accessibility"),
          issueId: z.string().min(1).max(200),
        })
        .strict(),
    ]),
  })
  .strict();

export async function handleAutomation(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
) {
  requireRole(actor, "editor");
  if (process.env.NODE_ENV !== "development" || !isLoopback(request))
    throw new HttpError(
      403,
      "Local Codex fixes are available only from localhost in development. Open this project's local workspace.",
    );
  const root = await realpath(config.aiProjectDirectory ?? process.cwd());
  if (request.method !== "GET")
    await consumeRateLimit(client, `ai-mutate:${actor.id}`, 120, 60_000);
  if (path[1] !== "fixes") throw new HttpError(404, "Not found.");
  if (path.length === 2 && request.method === "POST") {
    await consumeRateLimit(client, `codex:${actor.id}`, 10, 60_000);
    const input = requestSchema.parse(await readJson(request));
    return withProjectLock(root, async () => {
      const [flows, comments] = await Promise.all([
        readFlows(client, config.apiPath),
        readComments(client),
      ]);
      const flow = flows.find((flow) => flow.id === input.flowId);
      const step = flow?.steps.find((step) => step.id === input.stepId);
      if (!flow || !step) throw new HttpError(404, "Screen not found.");
      let context;
      try {
        context = feedbackContext(flow, step, comments, input.target);
      } catch (error) {
        throw new HttpError(400, (error as Error).message);
      }
      if (!context.comments.length && !context.issues.length)
        throw new HttpError(
          400,
          "This screen has no selected comments or saved accessibility issues to fix.",
        );
      let instructions = "";
      try {
        instructions = await readFile(
          resolve(
            config.aiInstructionsFile ?? ".revisionlab/ai-instructions.md",
          ),
          "utf8",
        );
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT")
          throw new HttpError(503, "Could not read workspace AI instructions.");
      }
      const prompt = codexPrompt(context, instructions);
      if (prompt.length > 128_000)
        throw new HttpError(
          400,
          "There is too much feedback for one run. Select an individual comment or issue.",
        );
      const image = await screenImage(step.screenshot, client, config).catch(
        () => null,
      );
      const result = await runCodex(
        root,
        `${prompt}\n\nScreenshot evidence: ${image ? "The exact recorded screen is attached." : "Unavailable. Do not infer pixel positions or appearance."}`,
        request.signal,
        image,
      );
      if (!image)
        result.warnings.push(
          "The recorded screenshot was unavailable; verify the visual target before applying.",
        );
      const sources = await prepareChanges(root, result.changes);
      const proposal: StoredProposal = {
        ...result,
        changes: result.changes.filter((change) =>
          sources.some((source) => source.file === change.file),
        ),
        id: randomUUID(),
        projectId: config.projectId,
        context,
        sources,
        status: "proposed",
      };
      await saveProposal(root, proposal);
      return json(publicProposal(proposal), 201);
    });
  }
  if (path.length !== 3 || !z.string().uuid().safeParse(path[2]).success)
    throw new HttpError(404, "Not found.");
  if (request.method === "GET")
    return json(
      publicProposal(await readProposal(root, path[2], config.projectId)),
    );
  if (request.method !== "PATCH") throw new HttpError(404, "Not found.");
  const { action } = z
    .object({ action: z.enum(["apply", "discard", "undo", "pr"]) })
    .strict()
    .parse(await readJson(request));
  return withProjectLock(root, async () => {
    const proposal = await readProposal(root, path[2], config.projectId);
    let sourceOperation: boolean | null = null;
    if (action === "pr") {
      if (
        !["proposed", "applied"].includes(proposal.status) ||
        !proposal.changes.length
      )
        throw new HttpError(409, "This fix cannot be published.");
      proposal.prUrl ??= await createFixPullRequest(root, proposal);
    } else if (action === "discard") {
      if (proposal.status !== "proposed")
        throw new HttpError(409, "Only a proposed fix can be discarded.");
      proposal.status = "discarded";
    } else {
      const undo = action === "undo";
      if (
        proposal.status !== (undo ? "applied" : "proposed") ||
        !proposal.changes.length
      )
        throw new HttpError(409, "This fix is not ready for that action.");
      await replaceSources(root, proposal.sources, undo);
      sourceOperation = undo;
      proposal.status = undo ? "undone" : "applied";
    }
    try {
      await saveProposal(root, proposal);
    } catch (error) {
      if (sourceOperation !== null)
        await replaceSources(root, proposal.sources, !sourceOperation);
      throw error;
    }
    return json(publicProposal(proposal));
  });
}
