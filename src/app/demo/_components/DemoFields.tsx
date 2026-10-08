import { Field, Input, SimpleGrid, Stack } from "@chakra-ui/react";
import type { DemoDraft, DemoErrors, DemoField } from "./demoData";

interface DemoInputDefinition {
  name: DemoField;
  label: string;
  type: "number" | "text" | "email";
  help?: string;
  min?: number;
  max?: number;
  step?: number;
}

const fields: DemoInputDefinition[][] = [
  [
    {
      name: "vehiclePrice",
      label: "Vehicle price (£)",
      type: "number",
      min: 1000,
      max: 100000,
      step: 1,
    },
    {
      name: "deposit",
      label: "Deposit (£)",
      type: "number",
      min: 0,
      step: 1,
      help: "Your deposit must be less than the vehicle price.",
    },
    {
      name: "months",
      label: "Term (months)",
      type: "number",
      min: 12,
      max: 60,
      step: 1,
      help: "Choose between 12 and 60 months.",
    },
  ],
  [
    { name: "firstName", label: "First name", type: "text" },
    { name: "lastName", label: "Last name", type: "text" },
    {
      name: "email",
      label: "Email address",
      type: "email",
      help: "Use a sample address. This demo does not send email.",
    },
  ],
  [
    {
      name: "income",
      label: "Monthly take-home income (£)",
      type: "number",
      min: 0,
      max: 100000,
      step: 1,
      help: "Income after tax in this fictional example.",
    },
    {
      name: "spending",
      label: "Monthly living costs (£)",
      type: "number",
      min: 0,
      max: 100000,
      step: 1,
      help: "Include housing, bills and other regular commitments.",
    },
  ],
];

export function DemoFields({
  step,
  draft,
  errors,
  onChange,
}: {
  step: number;
  draft: DemoDraft;
  errors: DemoErrors;
  onChange: (field: DemoField, value: string) => void;
}) {
  return (
    <Stack gap="6">
      <SimpleGrid columns={{ base: 1, md: step === 1 ? 2 : 1 }} gap="6">
        {fields[step].map((field) => (
          <Field.Root
            key={field.name}
            id={`demo-${field.name}`}
            required
            invalid={Boolean(errors[field.name])}
            gridColumn={field.name === "email" ? "1 / -1" : undefined}
          >
            <Field.Label>
              {field.label}
              <Field.RequiredIndicator />
            </Field.Label>
            <Input
              name={field.name}
              type={field.type}
              value={draft[field.name]}
              onChange={(event) => onChange(field.name, event.target.value)}
              autoComplete="off"
              maxLength={100}
              min={field.min}
              max={field.max}
              step={field.step}
              size="lg"
              bg="bg"
              focusRing="inside"
              focusRingColor="colorPalette.fg"
            />
            {field.help && <Field.HelperText>{field.help}</Field.HelperText>}
            <Field.ErrorText>{errors[field.name]}</Field.ErrorText>
          </Field.Root>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
