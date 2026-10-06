import type { Client, Row, Transaction } from "@libsql/client";
import { z } from "zod";
import type { ReviewTicket } from "../../feedback-review.js";

export const ticketFieldsSchema = z
  .object({
    summary: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1).max(20_000),
    priority: z.enum(["High", "Medium", "Low"]),
    acceptanceCriteria: z.string().trim().min(1).max(10_000),
    status: z.enum(["draft", "ready", "fixed"]),
  })
  .strict();

export const generatedTicketsSchema = z
  .object({
    tickets: z
      .array(
        z
          .object({
            summary: z.string().trim().min(1).max(255),
            description: z.string().trim().min(1).max(20_000),
            priority: z.enum(["High", "Medium", "Low"]),
            acceptanceCriteria: z.string().trim().min(1).max(10_000),
            evidenceIds: z.array(z.string().min(1).max(300)).min(1).max(50),
          })
          .strict(),
      )
      .min(1)
      .max(20),
  })
  .strict();

export function ticketFromRow(row: Row): ReviewTicket {
  return {
    ...JSON.parse(String(row.ticket_json)),
    id: String(row.id),
    revision: Number(row.revision),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export async function readTickets(client: Client) {
  const result = await client.execute(
    "SELECT * FROM feedback_tickets ORDER BY created_at DESC, id",
  );
  return result.rows.map(ticketFromRow);
}

export async function retainTicketEvidence(
  transaction: Transaction,
  ticket: ReviewTicket,
) {
  for (const item of ticket.evidence) {
    await transaction.execute({
      sql: "INSERT OR IGNORE INTO feedback_ticket_evidence (ticket_id,evidence_id,comment_id,screenshot_id) VALUES (?,?,?,?)",
      args: [
        ticket.id,
        item.id,
        item.commentId ?? null,
        item.screenshotId ?? null,
      ],
    });
  }
}
