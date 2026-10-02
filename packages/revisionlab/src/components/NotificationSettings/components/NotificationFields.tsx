import { Checkbox, Field, Input, Stack } from "@chakra-ui/react";

export function NotificationInput({
  label,
  value,
  onChange,
  type = "text",
  helper,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password" | "number";
  helper?: string;
  disabled?: boolean;
}) {
  return (
    <Field.Root disabled={disabled}>
      <Field.Label>{label}</Field.Label>
      <Input
        borderColor="gray.500"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete={type === "password" ? "new-password" : "off"}
      />
      {helper && <Field.HelperText>{helper}</Field.HelperText>}
    </Field.Root>
  );
}

export function NotificationToggle({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Checkbox.Root
      checked={checked}
      onCheckedChange={(event) => onChange(event.checked === true)}
      disabled={disabled}
      colorPalette="blue"
    >
      <Checkbox.HiddenInput />
      <Checkbox.Control borderColor="gray.500">
        <Checkbox.Indicator />
      </Checkbox.Control>
      <Checkbox.Label>{label}</Checkbox.Label>
    </Checkbox.Root>
  );
}

export function NotificationSecretField({
  label,
  configured,
  value,
  onChange,
  disabled,
}: {
  label: string;
  configured: boolean;
  value: string | null | undefined;
  onChange: (value: string | null | undefined) => void;
  disabled: boolean;
}) {
  return (
    <Stack gap="2">
      <NotificationInput
        label={label}
        type="password"
        value={value ?? ""}
        disabled={disabled || value === null}
        onChange={(next) => onChange(next || undefined)}
        helper={
          configured
            ? "Saved securely. Leave blank to keep the current value."
            : "Stored securely on the server."
        }
      />
      {configured && (
        <NotificationToggle
          label={`Remove saved ${label}`}
          checked={value === null}
          onChange={(remove) => onChange(remove ? null : undefined)}
          disabled={disabled}
        />
      )}
    </Stack>
  );
}
