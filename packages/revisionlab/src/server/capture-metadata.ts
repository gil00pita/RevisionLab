import { z } from "zod";

export const captureMetadataSchema = z
  .object({
    width: z.number().int().min(1).max(16384),
    height: z.number().int().min(1).max(4000),
    reason: z.enum(["page", "click", "change", "manual"]),
    cursor: z
      .array(
        z
          .object({
            x: z.number().min(0).max(1),
            y: z.number().min(0).max(1),
            t: z.number().int().min(0).max(86_400_000),
            click: z.number().int().min(1).max(1_000_000).optional(),
          })
          .strict(),
      )
      .max(200)
      .refine(
        (points) =>
          points.every(
            (point, index) => !index || point.t >= points[index - 1].t,
          ),
        "Cursor samples must be chronological.",
      ),
  })
  .strict();
