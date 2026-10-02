import { AI_INSTRUCTIONS_MAX_LENGTH } from "../ai-instructions.js";
import { z } from "zod";
import { designSystems } from "../ai-instructions/index.js";

const resourceUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return (
        ["https:", "http:"].includes(url.protocol) &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }, "Use a complete HTTP or HTTPS URL without credentials.");

export const aiSettingsSchema = z
  .object({
    instructions: z.string().max(AI_INSTRUCTIONS_MAX_LENGTH),
    designSystemEnabled: z.boolean(),
    designSystemId: z
      .string()
      .refine(
        (id) =>
          id === "" ||
          id === "manual" ||
          designSystems.some((system) => system.id === id),
        "Choose a listed design system or Manual.",
      ),
    manual: z
      .object({
        name: z.string().trim().max(120),
        githubUrl: resourceUrl,
        docsUrl: resourceUrl,
        designUrl: resourceUrl,
        skillUrl: resourceUrl,
        mcpUrl: resourceUrl,
      })
      .strict(),
    installSkill: z.boolean(),
    configureMcp: z.boolean(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.designSystemEnabled &&
      (!value.designSystemId ||
        (value.designSystemId === "manual" && !value.manual.name))
    ) {
      context.addIssue({
        code: "custom",
        message: "Choose a design system and give a manual system a name.",
        path: ["designSystemId"],
      });
    }
  });
