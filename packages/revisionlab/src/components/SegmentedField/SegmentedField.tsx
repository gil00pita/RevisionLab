import { Field, SegmentGroup } from "@chakra-ui/react";

export function SegmentedField({
  label,
  value,
  options,
  disabled = false,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <Field.Root disabled={disabled}>
      <Field.Label>{label}</Field.Label>
      <SegmentGroup.Root
        aria-label={label}
        value={value}
        disabled={disabled}
        onValueChange={(event) => {
          if (event.value) onChange(event.value);
        }}
        w="full"
        minW="0"
        display="flex"
        flexWrap="wrap"
        gap="1"
        bg="bg.subtle"
        p="1"
        borderRadius="lg"
      >
        {options.map((option) => (
          <SegmentGroup.Item
            key={option.value}
            value={option.value}
            flex="1"
            minW="max-content"
            minH="11"
            px="3"
            borderRadius="md"
            justifyContent="center"
            cursor="pointer"
            _checked={{ bg: "bg.panel", color: "fg", shadow: "sm" }}
            _focusVisible={{
              outlineWidth: "2px",
              outlineStyle: "solid",
              outlineColor: "border.emphasized",
              outlineOffset: "2px",
            }}
          >
            <SegmentGroup.ItemText>{option.label}</SegmentGroup.ItemText>
            <SegmentGroup.ItemHiddenInput />
          </SegmentGroup.Item>
        ))}
      </SegmentGroup.Root>
    </Field.Root>
  );
}
