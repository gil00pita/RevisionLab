import {
  Box,
  Field,
  NativeSelect,
  type HTMLChakraProps,
} from "@chakra-ui/react";
function SelectOption({
  value,
  children,
}: Pick<HTMLChakraProps<"option">, "value" | "children">) {
  return (
    <Box as="option" {...{ value }}>
      {children}
    </Box>
  );
}

export function PersonaSelectField({
  label,
  value,
  options,
  onChange,
  compact = false,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <Field.Root minW="0" w={compact ? { base: "full", sm: "48" } : "full"}>
      <Field.Label srOnly={compact}>{label}</Field.Label>
      <NativeSelect.Root bg="bg.panel" rounded="lg" minH="11">
        <NativeSelect.Field
          value={value}
          onChange={(event) => onChange(event.target.value)}
          h="11"
        >
          {options.map((option) => (
            <SelectOption key={option.value} value={option.value}>
              {option.label}
            </SelectOption>
          ))}
        </NativeSelect.Field>
        <NativeSelect.Indicator />
      </NativeSelect.Root>
    </Field.Root>
  );
}
