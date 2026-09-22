import { createListCollection, Field, Portal, Select } from "@chakra-ui/react";
import type { RevisionLabStep } from "../../../server/types.js";

export function ScreenSelect({
  label,
  value,
  onChange,
  steps,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  steps: RevisionLabStep[];
  disabled: boolean;
}) {
  const collection = createListCollection({
    items: steps.map((step, index) => ({
      value: step.id,
      label: `${index + 1}. ${step.title}`,
    })),
  });
  return (
    <Field.Root required minW="0" flex="1">
      <Field.Label>{label}</Field.Label>
      <Select.Root
        collection={collection}
        value={value ? [value] : []}
        onValueChange={(event) => onChange(event.value[0] ?? "")}
        size="sm"
        disabled={disabled}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="Choose a screen" />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner data-revisionlab-ui="" zIndex="popover">
            <Select.Content>
              {collection.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  <Select.ItemText>{item.label}</Select.ItemText>
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
    </Field.Root>
  );
}
