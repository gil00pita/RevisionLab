import { designSystems } from "./catalogue.js";
import { defaultAiInstructions } from "./default-instructions.js";
import type { AiInstructionSettings, DesignSystemResources } from "./types.js";

export { designSystems, defaultAiInstructions };
export type { AiInstructionSettings, DesignSystemResources } from "./types.js";

export const defaultAiSettings: AiInstructionSettings = {
  instructions: defaultAiInstructions,
  designSystemEnabled: false,
  designSystemId: "",
  manual: {
    name: "",
    githubUrl: "",
    docsUrl: "",
    designUrl: "",
    skillUrl: "",
    mcpUrl: "",
  },
  installSkill: false,
  configureMcp: false,
};

export function selectedDesignSystem(
  settings: AiInstructionSettings,
): DesignSystemResources | undefined {
  return settings.designSystemId === "manual"
    ? settings.manual
    : designSystems.find((system) => system.id === settings.designSystemId);
}

/** Derive the appendix without changing the user's base prompt or duplicating sections. */
export function composeAiInstructions(settings: AiInstructionSettings): string {
  const system = selectedDesignSystem(settings);
  if (!settings.designSystemEnabled || !system?.name.trim())
    return settings.instructions;
  const resources = [
    ["GitHub", system.githubUrl],
    ["Documentation", system.docsUrl],
    ["Design guidelines (design.md)", system.designUrl],
    ["AI skill", system.skillUrl],
    ["MCP setup documentation or endpoint", system.mcpUrl],
  ].filter(([, url]) => url);
  return [
    settings.instructions,
    "",
    "# DESIGN SYSTEM",
    `Use ${system.name} as the design-system reference for this review and any proposed UI changes.`,
    "Read the linked documentation and available design guidelines before recommending components or patterns. Respect the project's installed version and existing constraints.",
    ...resources.map(([label, url]) => `${label}: ${url}`),
    ...(settings.installSkill && system.skillUrl
      ? [
          `Install the AI skill following the instructions at ${system.skillUrl}, using the receiving agent's supported skill setup.`,
        ]
      : []),
    ...(settings.configureMcp && system.mcpUrl
      ? [
          `Configure the MCP integration using ${system.mcpUrl}. This may be setup documentation rather than a server endpoint; follow its instructions for the receiving agent.`,
        ]
      : []),
  ].join("\n");
}
