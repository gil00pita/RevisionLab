import { CustomSmtpFields } from "./CustomSmtpFields.js";
import { Link, Stack, Text } from "@chakra-ui/react";
import { SegmentedField } from "../../SegmentedField/index.js";
import {
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
      <SegmentedField
        label="Email provider"
        value={settings.defaultProvider}
        disabled={disabled}
        options={[
          { value: "disabled", label: "Disabled" },
          { value: "custom", label: "SMTP" },
          { value: "resend", label: "Resend" },
          { value: "smtpdev", label: "SMTP.dev" },
          ...(configuration.environmentEmailConfigured ||
          configuration.settings.defaultProvider === "environment"
            ? [{ value: "environment", label: "Host configuration" }]
            : []),
        ]}
        onChange={(selected) => {
          const defaultProvider = emailProviders.find(
            (value) => value === selected,
          );
          if (defaultProvider) onChange({ ...settings, defaultProvider });
        }}
      />
      <Text fontSize="sm" color="fg.muted">
        Used for login links, invitations, and email notifications. Save to
        apply your selection.
      </Text>
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
      {settings.defaultProvider === "custom" && (
        <CustomSmtpFields
          value={settings.custom}
          disabled={disabled}
          password={secrets.customPassword}
          hasPassword={configuration.configuredSecrets.customPassword}
          onChange={(custom) => onChange({ ...settings, custom })}
          onPassword={(value) => onSecret("customPassword", value)}
        />
      )}
      {settings.defaultProvider === "resend" && (
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
      )}
      {settings.defaultProvider === "smtpdev" && (
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
            STARTTLS and your SMTP account credentials. The optional API key is
            saved for account management; it is not used to send emails.
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
      )}
    </Stack>
  );
}
