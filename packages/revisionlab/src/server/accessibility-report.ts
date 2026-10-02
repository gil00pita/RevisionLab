import { z } from "zod";
import { MAX_ACCESSIBILITY_REPORT_BYTES } from "../accessibility.js";

export const accessibilityReportSchema = z
  .strictObject({
    status: z.enum(["passed", "issues", "review", "unavailable"]),
    checkedAt: z.string().datetime().optional(),
    engineVersion: z.string().min(1).max(40).optional(),
    violationCount: z.number().int().min(0).max(1000),
    incomplete: z.number().int().min(0).max(1000),
    truncated: z.boolean(),
    reason: z.enum(["changed", "failed", "not-scanned"]).optional(),
    issues: z
      .array(
        z.strictObject({
            id: z.string().min(1).max(100),
            help: z.string().min(1).max(500),
            helpUrl: z
              .string()
              .max(500)
              .url()
              .refine((value) => {
                const url = new URL(value);
                return (
                  url.protocol === "https:" &&
                  url.hostname === "dequeuniversity.com" &&
                  !url.username &&
                  !url.password &&
                  !url.port
                );
              }, "Use an HTTPS Deque documentation URL."),
            impact: z
              .enum(["minor", "moderate", "serious", "critical"])
              .nullable(),
            count: z.number().int().min(1).max(1000000),
            targets: z.array(z.string().min(1).max(256)).max(10),
          }),
      )
      .max(50),
  })
  .refine(
    (value) =>
      new TextEncoder().encode(JSON.stringify(value)).byteLength <=
      MAX_ACCESSIBILITY_REPORT_BYTES,
    "Accessibility reports must fit within 64 KB.",
  )
  .refine((value) => {
    if (value.status === "unavailable")
      return (
        Boolean(value.reason) &&
        !value.checkedAt &&
        !value.issues.length &&
        !value.violationCount &&
        !value.incomplete
      );
    if (!value.checkedAt || !value.engineVersion || value.reason) return false;
    if (value.violationCount < value.issues.length) return false;
    if (!value.truncated && value.violationCount !== value.issues.length)
      return false;
    if (value.status === "issues")
      return value.violationCount > 0 && value.issues.length > 0;
    return (
      !value.violationCount &&
      !value.issues.length &&
      (value.status === "review"
        ? value.incomplete > 0
        : value.incomplete === 0)
    );
  }, "Accessibility status must match the saved findings.");
