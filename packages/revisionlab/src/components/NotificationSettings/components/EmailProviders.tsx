import { CustomSmtpFields } from "./CustomSmtpFields.js";
import {
  Field,
  HStack,
  Link,
  RadioGroup,
  Stack,
  Tabs,
  Text,
} from "@chakra-ui/react";
import {
  emailProviderLabels,
  emailProviders,
  type NotificationConfiguration,
  type NotificationSettings,
  type NotificationSecret,
  type NotificationUpdate,
} from "../../../notification-settings.js";
import {
  NotificationInput,
  NotificationSecretField,
} from "./NotificationFields.js";

export function EmailProviders({
  settings,
  secrets,
  configuration,
  disabled,
  onChange,
  onSecret,
}: {
  settings: NotificationSettings;
  secrets: NotificationUpdate["secrets"];
  configuration: NotificationConfiguration;
  disabled: boolean;
  onChange: (value: NotificationSettings) => void;
  onSecret: (
    name: NotificationSecret,
    value: string | null | undefined,
  ) => void;
}) {
  function secret(name: NotificationSecret, label: string) {
    return (
      <NotificationSecretField
        label={label}
        configured={configuration.configuredSecrets[name]}
        value={secrets[name]}
        onChange={(value) => onSecret(name, value)}
        disabled={disabled}
      />
    );
  }
  return (
    <Stack gap="5">
      <Field.Root disabled={disabled}>
        <RadioGroup.Root
          value={settings.defaultProvider}
          disabled={disabled}
          colorPalette="blue"
          onValueChange={(event) => {
            const value = emailProviders.find(
              (provider) => provider === event.value,
            );
            if (value) onChange({ ...settings, defaultProvider: value });
          }}
        >
          <RadioGroup.Label fontWeight="semibold">
            Default email provider
          </RadioGroup.Label>
          <HStack gap="4" flexWrap="wrap" mt="3">
            {emailProviders.map((provider) => (
              <RadioGroup.Item key={provider} value={provider}>
                <RadioGroup.ItemHiddenInput />
                <RadioGroup.ItemIndicator borderColor="fg.muted" />
                <RadioGroup.ItemText>
                  {emailProviderLabels[provider]}
                </RadioGroup.ItemText>
              </RadioGroup.Item>
            ))}
          </HStack>
        </RadioGroup.Root>
        <Field.HelperText>
          Used for login links, invitations, and email notifications. Opening a
          provider tab does not change the default.
        </Field.HelperText>
      </Field.Root>
      {settings.defaultProvider === "environment" && (
        <Text fontSize="sm" color="fg.muted">
          {configuration.environmentEmailConfigured
            ? "Resend delivery is configured by the host."
            : "No host email provider is configured. Local development can show login links; deployed email needs a configured provider."}
        </Text>
      )}
      {settings.defaultProvider === "disabled" && (
        <Text fontSize="sm" color="orange.fg">
          Email, including passwordless login links and invitations, will not be
          sent.
        </Text>
      )}
      {settings.defaultProvider === "smtpdev" && (
        <Text fontSize="sm" color="orange.fg">
          SMTP.dev delivers only inside its sandbox. External recipients will
          not receive login links or notifications.
        </Text>
      )}
      <Tabs.Root
        lazyMount
        unmountOnExit
        defaultValue={
          settings.defaultProvider === "resend" ||
          settings.defaultProvider === "smtpdev"
            ? settings.defaultProvider
            : "custom"
        }
        colorPalette="blue"
      >
        <Tabs.List aria-label="Email providers" flexWrap="wrap">
          <Tabs.Trigger value="custom">Custom SMTP</Tabs.Trigger>
          <Tabs.Trigger value="resend">Resend</Tabs.Trigger>
          <Tabs.Trigger value="smtpdev">SMTP.dev</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="custom" px="0">
          <CustomSmtpFields
            value={settings.custom}
            disabled={disabled}
            password={secrets.customPassword}
            hasPassword={configuration.configuredSecrets.customPassword}
            onChange={(custom) => onChange({ ...settings, custom })}
            onPassword={(value) => onSecret("customPassword", value)}
          />
        </Tabs.Content>
        <Tabs.Content value="resend" px="0">
          <Stack gap="4">
            <Link
              href="https://resend.com/signup"
              target="_blank"
              rel="noopener noreferrer"
              color="blue.fg"
            >
              Sign up for Resend
            </Link>
            {secret("resendApiKey", "Resend API key")}
            <NotificationInput
              label="Resend sender email"
              type="email"
              value={settings.resend.from}
              disabled={disabled}
              helper="Use a sender authorized by your Resend account."
              onChange={(from) => onChange({ ...settings, resend: { from } })}
            />
          </Stack>
        </Tabs.Content>
        <Tabs.Content value="smtpdev" px="0">
          <Stack gap="4">
            <Link
              href="https://smtp.dev/"
              target="_blank"
              rel="noopener noreferrer"
              color="blue.fg"
            >
              Sign up for SMTP.dev
            </Link>
            <Text color="orange.fg" fontSize="sm">
              Testing sandbox only. Sending uses send.smtp.dev on port 587 with
              STARTTLS and your SMTP account credentials. The optional API key
              is saved for account management; it is not used to send emails.
            </Text>
            {secret("smtpdevApiKey", "SMTP.dev API key")}
            <NotificationInput
              label="SMTP.dev SMTP username"
              type="email"
              value={settings.smtpdev.username}
              disabled={disabled}
              onChange={(username) =>
                onChange({
                  ...settings,
                  smtpdev: { ...settings.smtpdev, username },
                })
              }
            />
            {secret("smtpdevPassword", "SMTP.dev SMTP password")}
            <NotificationInput
              label="SMTP.dev sender email"
              type="email"
              value={settings.smtpdev.from}
              disabled={disabled}
              onChange={(from) =>
                onChange({
                  ...settings,
                  smtpdev: { ...settings.smtpdev, from },
                })
              }
            />
          </Stack>
        </Tabs.Content>
      </Tabs.Root>
    </Stack>
  );
}
