import { generateReviewTickets } from "./generate.js";
import type { Client } from "@libsql/client";
import { z } from "zod";
import { requireRole } from "../authentication.js";
import type { ResolvedConfig } from "../config.js";
import { write } from "../database.js";
import { HttpError, isLoopback, json, readJson } from "../security.js";
import type { RevisionLabActor } from "../types.js";
import { readReviewEvidence } from "./evidence.js";
import {
  readTickets,
  ticketFieldsSchema,
  ticketFromRow,
  retainTicketEvidence,
} from "./tickets.js";
import { addTicketTemplate, readTicketTemplates } from "./templates.js";

export async function handleFeedbackReview(
  request: Request,
  path: string[],
  client: Client,
  config: ResolvedConfig,
  actor: RevisionLabActor,
) {
  const local = process.env.NODE_ENV === "development" && isLoopback(request);
  if (path.length === 1 && request.method === "GET") {
    const [evidence, tickets, templateData] = await Promise.all([
      readReviewEvidence(client, config),
      readTickets(client),
      readTicketTemplates(config),
    ]);
    return json({
      evidence,
      tickets,
      canGenerate: local && actor.role !== "commenter",
      ...templateData,
    });
  }
  requireRole(actor, "editor");
  if (
    path.length === 2 &&
    path[1] === "templates" &&
    request.method === "POST"
  ) {
    const input = z
      .strictObject({
        name: z
          .string()
          .trim()
          .min(1)
          .max(100)
          .refine((name) => !/[\r\n]/.test(name)),
        markdown: z.string().trim().min(1).max(16_000),
      })
      .parse(await readJson(request, 24_000));
    return json(
      await addTicketTemplate(config, input.name, input.markdown),
      201,
    );
  }
  if (path.length === 2 && path[1] === "generate" && request.method === "POST")
    return generateReviewTickets(request, client, config, actor, local);
  if (
    path.length === 2 &&
    request.method === "PATCH" &&
    z.string().uuid().safeParse(path[1]).success
  ) {
    const { revision, ...fields } = ticketFieldsSchema
      .extend({ revision: z.number().int().nonnegative() })
      .strict()
      .parse(await readJson(request, 128_000));
    const ticket = await write(client, async (tx) => {
      const row = (
        await tx.execute({
          sql: "SELECT * FROM feedback_tickets WHERE id=?",
          args: [path[1]],
        })
      ).rows[0];
      if (!row) throw new HttpError(404, "Ticket draft not found.");
      const current = ticketFromRow(row);
      if (current.revision !== revision)
        throw new HttpError(
          409,
          "Another reviewer changed this ticket. Your edits are retained; copy them before reloading the saved draft.",
        );
      const updated = {
        ...current,
        ...fields,
        revision: revision + 1,
        updatedAt: new Date().toISOString(),
      };
      await tx.execute({
        sql: "UPDATE feedback_tickets SET ticket_json=?,revision=?,updated_at=? WHERE id=?",
        args: [
          JSON.stringify(updated),
          updated.revision,
          updated.updatedAt,
          updated.id,
        ],
      });
      await retainTicketEvidence(tx, updated);
      return updated;
    });
    return json(ticket);
  }
  throw new HttpError(404, "Feedback Review operation not found.");
}
