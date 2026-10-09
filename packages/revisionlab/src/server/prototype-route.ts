import { z } from "zod";

export const routeSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .regex(/^\/(?!\/)/, "Use a same-origin pathname.")
  .refine(
    (route) => !/[\\\u0000-\u001f]/.test(route),
    "Use a same-origin pathname.",
  );
