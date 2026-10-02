import type { Client, Transaction } from "@libsql/client";
import { z } from "zod";
import type { ResolvedConfig } from "./config.js";
import type { SetupProgress } from "../setup.js";
import { requireRole } from "./authentication.js";
import { write } from "./database.js";
import { validateSystemUrl } from "./membership-routes.js";
import { HttpError, json, readJson } from "./security.js";
import type { RevisionLabActor } from "./types.js";

export async function readSetup(
  client: Client | Transaction,
): Promise<SetupProgress> {
  const { rows } = await client.execute(
    "SELECT * FROM setup_progress WHERE id = 1",
  );
  const row = rows[0];
  return {
    step: Number(row?.step ?? 0),
    completed: Number(row?.completed) === 1,
    name: String(row?.name ?? ""),
    email: String(row?.email ?? ""),
  };
}

const inputSchema = z.discriminatedUnion("action", [
  z.strictObject({
    action: z.literal("identity"),
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(254),
    systemUrl: z.string().trim().min(1).max(2048),
  }),
  z.strictObject({
    action: z.literal("advance"),
    step: z.number().int().min(2).max(6),
  }),
  z.strictObject({ action: z.literal("finish") }),
]);

export async function handleSetup(
  request: Request,
  client: Client,
  actor: RevisionLabActor,
  config: ResolvedConfig,
) {
  requireRole(actor, "owner");
  if (request.method !== "PATCH") throw new HttpError(404, "Not found.");
  const input = inputSchema.parse(await readJson(request));
  const result = await write(client, async (tx) => {
    const current = await readSetup(tx);
    if (current.completed)
      throw new HttpError(
        409,
        "Setup is already complete. Use workspace settings to make changes.",
      );
    if (input.action === "identity") {
      if (
        (!actor.local || config.ownerEmail) &&
        input.email.toLowerCase() !== actor.email.toLowerCase()
      )
        throw new HttpError(400, "Use your verified owner email.");
      const url = validateSystemUrl(input.systemUrl);
      await tx.execute({
        sql: `INSERT INTO workspace_settings (id, system_url) VALUES (1, ?)
        ON CONFLICT(id) DO UPDATE SET system_url = excluded.system_url`,
        args: [url],
      });
      const email = input.email.toLowerCase();
      const duplicate = await tx.execute({
        sql: "SELECT id FROM reviewers WHERE email = ? AND id != ?",
        args: [email, actor.id],
      });
      if (duplicate.rows.length)
        throw new HttpError(
          409,
          "This email already belongs to another workspace user.",
        );
      await tx.execute({
        sql: "UPDATE reviewers SET name = ?, email = ? WHERE id = ?",
        args: [input.name, email, actor.id],
      });
      await tx.execute({
        sql: "UPDATE workspace_memberships SET email = ? WHERE reviewer_id = ?",
        args: [email, actor.id],
      });
      await tx.execute({
        sql: "UPDATE setup_progress SET name = ?, email = ?, step = MAX(step, 1) WHERE id = 1",
        args: [input.name, input.email.toLowerCase()],
      });
    } else {
      if (current.step < 1)
        throw new HttpError(400, "Save your identity and live URL first.");
      if (input.action === "finish") {
        await tx.execute(
          "UPDATE setup_progress SET completed = 1 WHERE id = 1",
        );
      } else {
        if (input.step > current.step + 1)
          throw new HttpError(400, "Complete the preceding step first.");
        await tx.execute({
          sql: "UPDATE setup_progress SET step = MAX(step, ?) WHERE id = 1",
          args: [input.step],
        });
      }
    }
    return readSetup(tx);
  });
  return json(result);
}
