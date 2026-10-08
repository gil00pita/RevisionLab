import { Field, HStack, RadioGroup, Stack } from "@chakra-ui/react";
import type { NotificationSettings } from "../../../notification-settings.js";
import {
  NotificationInput,
  NotificationSecretField,
} from "./NotificationFields.js";

export function CustomSmtpFields({
  value,
  disabled,
  password,
  hasPassword,
  onChange,
  onPassword,
}: {
  value: NotificationSettings["custom"];
  disabled: boolean;
  password: string | null | undefined;
  hasPassword: boolean;
  onChange: (value: NotificationSettings["custom"]) => void;
  onPassword: (value: string | null | undefined) => void;
}) {
  return (
    <Stack gap="4">
      <NotificationInput
        label="SMTP host"
        value={value.host}
        disabled={disabled}
        onChange={(host) => onChange({ ...value, host })}
      />
      <NotificationInput
        label="SMTP port"
        type="number"
        value={String(value.port)}
        disabled={disabled}
        onChange={(port) => onChange({ ...value, port: Number(port) })}
      />
      <Field.Root disabled={disabled}>
        <RadioGroup.Root
          value={value.security}
          disabled={disabled}
          colorPalette="blue"
          onValueChange={(event) => {
            if (event.value === "tls" || event.value === "starttls")
              onChange({ ...value, security: event.value });
          }}
        >
          <RadioGroup.Label>Connection security</RadioGroup.Label>
          <HStack gap="5" mt="2" flexWrap="wrap">
            {(
              [
                ["starttls", "STARTTLS (usually port 587)"],
                ["tls", "TLS (usually port 465)"],
              ] as const
            ).map(([security, label]) => (
              <RadioGroup.Item key={security} value={security}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator borderColor="fg.muted" />
                <RadioGroup.ItemText>{label}</RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </HStack>
        </RadioGroup.Root>
        <Field.HelperText>
          Connections require TLS with a valid server certificate.
        </Field.HelperText>
      </Field.Root>
      <NotificationInput
        label="SMTP username"
        value={value.username}
        disabled={disabled}
        onChange={(username) => onChange({ ...value, username })}
      />
      <NotificationSecretField
        label="SMTP password"
        configured={hasPassword}
        value={password}
        onChange={onPassword}
        disabled={disabled}
      />
      <NotificationInput
        label="Custom SMTP sender email"
        type="email"
        value={value.from}
        disabled={disabled}
        onChange={(from) => onChange({ ...value, from })}
      />
    </Stack>
  );
}
