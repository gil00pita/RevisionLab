import { Checkbox, Field, Flex, Link, Stack, Text } from "@chakra-ui/react";
import {
  selectedDesignSystem,
  type AiInstructionSettings,
} from "../../../ai-instructions/index.js";

export function DesignSystemResources({
  value,
  disabled,
  onChange,
}: {
  value: AiInstructionSettings;
  disabled: boolean;
  onChange: (patch: Partial<AiInstructionSettings>) => void;
}) {
  const system = selectedDesignSystem(value);
  if (!system) return null;
  const resources = [
    ["GitHub", system.githubUrl],
    ["Docs", system.docsUrl],
    ["design.md", system.designUrl],
    ["AI skill", system.skillUrl],
    ["MCP", system.mcpUrl],
  ];
  const options = [
    {
      key: "installSkill" as const,
      url: system.skillUrl,
      label: "Include AI skill installation instructions",
    },
    {
      key: "configureMcp" as const,
      url: system.mcpUrl,
      label: "Include MCP setup instructions",
    },
  ];
  return (
    <Stack gap="3">
      <Flex gap="4" wrap="wrap">
        {resources
          .filter(([, url]) => /^https?:\/\//i.test(url))
          .map(([label, url]) => (
            <Link
              key={label}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              color="blue.fg"
              fontSize="sm"
            >
              {label}
            </Link>
          ))}
      </Flex>
      {options
        .filter((option) => option.url.trim())
        .map(({ key, label }) => (
          <Field.Root key={key} disabled={disabled}>
            <Checkbox.Root
              checked={value[key]}
              disabled={disabled}
              colorPalette="blue"
              onCheckedChange={(event) =>
                onChange({ [key]: event.checked === true })
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control borderColor="fg.muted">
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>{label}</Checkbox.Label>
            </Checkbox.Root>
          </Field.Root>
        ))}
      {!system.skillUrl && !system.mcpUrl ? (
        <Text fontSize="sm" color="fg.muted">
          No AI skill or MCP resource is listed for this system.
        </Text>
      ) : (
        <Text fontSize="sm" color="fg.muted">
          These options add setup requests for your AI agent. Saving does not
          install a skill or connect an MCP server.
        </Text>
      )}
    </Stack>
  );
}
