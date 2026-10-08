import { Heading, Link, Stack, Text } from "@chakra-ui/react";
import { SegmentedField } from "../../SegmentedField/index.js";
import type {
  NotificationConfiguration,
  NotificationSettings,
  NotificationUpdate,
} from "../../../notification-settings.js";
import {
  NotificationInput,
  NotificationSecretField,
  NotificationToggle,
} from "./NotificationFields.js";

export function NotificationEvents({
  settings,
  configuration,
  secrets,
  recipients,
  disabled,
  onChange,
  onRecipients,
  onWebhook,
}: {
  settings: NotificationSettings;
  configuration: NotificationConfiguration;
  secrets: NotificationUpdate["secrets"];
  recipients: string;
  disabled: boolean;
  onChange: (value: NotificationSettings) => void;
  onRecipients: (value: string) => void;
  onWebhook: (value: string | null | undefined) => void;
}) {
  return (
    <Stack gap="7">
      {settings.defaultProvider !== "disabled" && (
        <Stack gap="4">
          <Heading as="h3" size="md">
            Email notifications
          </Heading>
          <NotificationInput
            label="Notification recipients"
            value={recipients}
            onChange={onRecipients}
            disabled={disabled}
            helper="Separate email addresses with commas (up to 20). These recipients will receive the selected review events."
          />
          <NotificationToggle
            label="Email new comments and replies"
            checked={settings.email.comments}
            disabled={disabled}
            onChange={(comments) =>
              onChange({ ...settings, email: { ...settings.email, comments } })
            }
          />
          <NotificationToggle
            label="Email new accessibility issues"
            checked={settings.email.issues}
            disabled={disabled}
            onChange={(issues) =>
              onChange({ ...settings, email: { ...settings.email, issues } })
            }
          />
        </Stack>
      )}
      <Stack gap="4">
        <Heading as="h3" size="md">
          Slack notifications
        </Heading>
        <SegmentedField
          label="Slack"
          value={settings.slack.enabled ? "enabled" : "disabled"}
          disabled={disabled}
          options={[
            { value: "disabled", label: "Disabled" },
            { value: "enabled", label: "Enabled" },
          ]}
          onChange={(value) =>
            onChange({
              ...settings,
              slack: { ...settings.slack, enabled: value === "enabled" },
            })
          }
        />
        {settings.slack.enabled && (
          <>
            <Text fontSize="sm" color="fg.muted">
              Connect a channel using an incoming webhook from your Slack app.
              Notifications include review text; choose a channel appropriate
              for this workspace.
            </Text>
            <Link
              href="https://api.slack.com/apps"
              target="_blank"
              rel="noopener noreferrer"
              color="blue.fg"
            >
              Create or configure a Slack app
            </Link>
            <Link
              href="https://docs.slack.dev/messaging/sending-messages-using-incoming-webhooks/"
              target="_blank"
              rel="noopener noreferrer"
              color="blue.fg"
            >
              How to create an incoming webhook
            </Link>
            <NotificationSecretField
              label="Slack webhook URL"
              configured={configuration.configuredSecrets.slackWebhook}
              value={secrets.slackWebhook}
              onChange={onWebhook}
              disabled={disabled}
            />
            <NotificationToggle
              label="Slack new comments and replies"
              checked={settings.slack.comments}
              disabled={disabled}
              onChange={(comments) =>
                onChange({
                  ...settings,
                  slack: { ...settings.slack, comments },
                })
              }
            />
            <NotificationToggle
              label="Slack new accessibility issues"
              checked={settings.slack.issues}
              disabled={disabled}
              onChange={(issues) =>
                onChange({ ...settings, slack: { ...settings.slack, issues } })
              }
            />
          </>
        )}
      </Stack>
      <Text fontSize="sm" color="fg.muted">
        Issues are accessibility findings saved with new recorded screens. Live
        scans, reused screens, and restored history do not send notifications.
        Delivery failures do not undo saved feedback; automatic retries are not
        enabled.
      </Text>
    </Stack>
  );
}
