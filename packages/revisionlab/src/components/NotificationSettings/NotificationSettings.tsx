"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Heading,
  HStack,
  Separator,
  Stack,
  Text,
} from "@chakra-ui/react";
import { EmailProviders } from "./components/EmailProviders.js";
import { NotificationEvents } from "./components/NotificationEvents.js";
import { NotificationInput } from "./components/NotificationFields.js";
import { useNotificationSettings } from "./hooks/useNotificationSettings.js";

export function NotificationSettings({
  apiPath,
  onBusyChange,
  onContinue,
  disabled = false,
}: {
  apiPath: string;
  onBusyChange?: (busy: boolean) => void;
  onContinue?: () => Promise<void>;
  disabled?: boolean;
}) {
  const form = useNotificationSettings(apiPath);
  const [testRecipient, setTestRecipient] = useState("");
  const busy = form.busy || form.loading;
  useEffect(() => {
    onBusyChange?.(busy);
    return () => onBusyChange?.(false);
  }, [busy, onBusyChange]);
  if (form.loading)
    return <Text role="status">Loading notification settings…</Text>;
  if (!form.configuration || !form.draft)
    return (
      <Stack gap="3">
        <Text role="alert" color="red.700">
          {form.error}
        </Text>
        <Button variant="outline" onClick={() => void form.load()}>
          Retry loading notifications
        </Button>
      </Stack>
    );
  const locked = disabled || busy;
  return (
    <Stack gap="6">
      <Stack
        as="form"
        id="revisionlab-notification-settings"
        gap="6"
        onSubmit={(event) => {
          event.preventDefault();
          if (!locked)
            void form.save().then((saved) => {
              if (saved) return onContinue?.();
            });
        }}
      >
        <Stack gap="2">
          {!onContinue && (
            <Heading as="h2" size="lg">
              Notifications
            </Heading>
          )}
          <Text color="gray.600">
            Set up email delivery and choose where new review activity is sent.
            These settings apply to this installation.
          </Text>
        </Stack>
        {!form.configuration.encryptionAvailable && (
          <Text role="status" color="orange.800">
            Before saving credentials, set
            REVISIONLAB_NOTIFICATION_ENCRYPTION_KEY on the host to a 32-byte
            base64url secret.
          </Text>
        )}
        <EmailProviders
          settings={form.draft}
          secrets={form.secrets}
          configuration={form.configuration}
          disabled={locked}
          onChange={form.change}
          onSecret={form.changeSecret}
        />
        <Separator />
        <NotificationEvents
          settings={form.draft}
          secrets={form.secrets}
          configuration={form.configuration}
          recipients={form.recipients}
          disabled={locked}
          onChange={form.change}
          onRecipients={form.setRecipients}
          onWebhook={(value) => form.changeSecret("slackWebhook", value)}
        />
        <Button
          type="button"
          colorPalette="blue"
          alignSelf="start"
          loading={form.busy}
          disabled={locked}
          onClick={() => void form.save()}
        >
          Save notification settings
        </Button>
        {form.dirty && (
          <Text fontSize="sm" color="gray.600">
            You have unsaved notification settings. Save before testing.
          </Text>
        )}
      </Stack>
      <Separator />
      <Stack gap="4">
        <Heading as="h3" size="md">
          Test delivery
        </Heading>
        <NotificationInput
          label="Test recipient email"
          type="email"
          value={testRecipient}
          onChange={setTestRecipient}
          disabled={locked}
          helper="Tests use the saved default provider and send a real message when configured."
        />
        <HStack gap="3" flexWrap="wrap">
          <Button
            variant="outline"
            disabled={locked || form.dirty || !testRecipient.trim()}
            onClick={() => void form.test("email", testRecipient)}
          >
            Send test email
          </Button>
          <Button
            variant="outline"
            disabled={
              locked ||
              form.dirty ||
              !form.configuration.configuredSecrets.slackWebhook
            }
            onClick={() => void form.test("slack", "")}
          >
            Send test Slack message
          </Button>
          <Button
            variant="ghost"
            disabled={locked || form.dirty}
            onClick={() => void form.load()}
          >
            Refresh delivery status
          </Button>
        </HStack>
        <Text fontSize="sm" color="gray.600">
          Email:{" "}
          {form.configuration.lastDelivery.email ?? "No delivery attempt yet."}
        </Text>
        <Text fontSize="sm" color="gray.600">
          Slack:{" "}
          {form.configuration.lastDelivery.slack ?? "No delivery attempt yet."}
        </Text>
      </Stack>
      {form.dirty && (
        <Button
          variant="ghost"
          alignSelf="start"
          disabled={locked}
          onClick={() => void form.load()}
        >
          Discard changes and reload settings
        </Button>
      )}
      {form.error && (
        <Text role="alert" color="red.700">
          {form.error}
        </Text>
      )}
      {form.message && (
        <Text role="status" color="green.700">
          {form.message}
        </Text>
      )}
    </Stack>
  );
}
