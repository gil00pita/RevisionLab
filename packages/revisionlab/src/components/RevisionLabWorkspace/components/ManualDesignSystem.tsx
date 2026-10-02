import { Field, Input, Stack, Text } from "@chakra-ui/react";
import type { DesignSystemResources } from "../../../ai-instructions/index.js";

const fields: { key: keyof DesignSystemResources; label: string }[] = [
  { key: "name", label: "Design system name" },
  { key: "githubUrl", label: "GitHub URL" },
  { key: "docsUrl", label: "Documentation URL" },
  { key: "designUrl", label: "design.md URL" },
  { key: "skillUrl", label: "AI skill URL" },
  { key: "mcpUrl", label: "MCP setup or endpoint URL" },
];

export function ManualDesignSystem({
  value,
  disabled,
  onChange,
}: {
  value: DesignSystemResources;
  disabled: boolean;
  onChange: (value: DesignSystemResources) => void;
}) {
  return (
    <Stack gap="4">
      <Text fontSize="sm" color="fg.muted">
        Add your own system. Only its name is required; resource links are
        optional.
      </Text>
      {fields.map(({ key, label }) => (
        <Field.Root key={key} required={key === "name"} disabled={disabled}>
          <Field.Label>
            {label}
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            value={value[key]}
            type={key === "name" ? "text" : "url"}
            maxLength={key === "name" ? 120 : 2048}
            borderColor="gray.500"
            onChange={(event) =>
              onChange({ ...value, [key]: event.target.value })
            }
          />
        </Field.Root>
      ))}
    </Stack>
  );
}
