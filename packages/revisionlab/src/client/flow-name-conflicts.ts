import { z } from "zod";
import { ApiError } from "./api.js";

const conflictSchema = z.object({
  code: z.literal("FLOW_NAME_EXISTS"),
  conflicts: z
    .array(
      z.object({
        id: z.string().uuid(),
        name: z.string(),
        persona: z.string(),
        route: z.string(),
        version: z.number().int().positive(),
        canReplace: z.boolean(),
      }),
    )
    .min(1),
});

export type FlowNameConflict = z.infer<
  typeof conflictSchema
>["conflicts"][number];

export function flowNameConflicts(error: unknown): FlowNameConflict[] | null {
  if (!(error instanceof ApiError) || error.status !== 409) return null;
  const parsed = conflictSchema.safeParse(error.details);
  return parsed.success ? parsed.data.conflicts : null;
}
