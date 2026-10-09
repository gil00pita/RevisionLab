"use client";
import { WorkspacePageSkeleton } from "../WorkspacePageSkeleton/index.js";

import { useEffect, useState, type RefObject } from "react";
import {
  Accordion,
  Button,
  Heading,
  HStack,
  Portal,
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
  discardActionContainer,
  disabled = false,
}: {
  apiPath: string;
  onBusyChange?: (busy: boolean) => void;
  onContinue?: () => Promise<void>;
  discardActionContainer?: RefObject<HTMLElement | null>;
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
    return <WorkspacePageSkeleton page="notifications" variant="content" />;
  if (!form.configuration || !form.draft)
    return (
      <Stack gap="3">
        <Text role="alert" color="red.fg">
          {form.error}
        </Text>
        <Button variant="outline" onClick={() => void form.load()}>
          Retry loading notifications
        </Button>
      </Stack>
    );
  const locked = disabled || busy;
  const discardAction = form.dirty && (
    <Button
      type="button"
      variant="ghost"
      alignSelf="start"
      maxW={discardActionContainer ? "full" : undefined}
      whiteSpace={discardActionContainer ? "normal" : undefined}
      h={discardActionContainer ? "auto" : undefined}
      minH={discardActionContainer ? "10" : undefined}
      py={discardActionContainer ? "2" : undefined}
      disabled={locked}
      onClick={() => void form.load()}
    >
      Discard changes and reload settings
    </Button>
  );
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
          <Text color="fg.muted">
            Set up email delivery and choose where new review activity is sent.
            These settings apply to this installation.
          </Text>
        </Stack>
        {!form.configuration.encryptionAvailable &&
          (form.draft.slack.enabled ||
            ["custom", "resend", "smtpdev"].includes(
              form.draft.defaultProvider,
            )) && (
            <Text role="status" color="orange.fg">
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
        {!onContinue && (
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
        )}
        {form.dirty && (
          <Text fontSize="sm" color="fg.muted">
            You have unsaved notification settings. Save before testing.
          </Text>
        )}
      </Stack>
      {(form.draft.defaultProvider !== "disabled" ||
        form.draft.slack.enabled) && (
        <Accordion.Root collapsible defaultValue={[]}>
          <Accordion.Item value="test-delivery">
            <Accordion.ItemTrigger>
              <Text flex="1">Test delivery</Text>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody px="0">
                <Stack gap="4">
                  {form.draft.defaultProvider !== "disabled" && (
                    <NotificationInput
                      label="Test recipient email"
                      type="email"
                      value={testRecipient}
                      onChange={setTestRecipient}
                      disabled={locked}
                      helper="Tests use the saved default provider and send a real message when configured."
                    />
                  )}
                  <HStack gap="3" flexWrap="wrap">
                    {form.draft.defaultProvider !== "disabled" && (
                      <Button
                        variant="outline"
                        disabled={locked || form.dirty || !testRecipient.trim()}
                        onClick={() => void form.test("email", testRecipient)}
                      >
                        Send test email
                      </Button>
                    )}
                    {form.draft.slack.enabled && (
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
                    )}
                    <Button
                      variant="ghost"
                      disabled={locked || form.dirty}
                      onClick={() => void form.load()}
                    >
                      Refresh delivery status
                    </Button>
                  </HStack>
                  <Text fontSize="sm" color="fg.muted">
                    Email:{" "}
                    {form.configuration.lastDelivery.email ??
                      "No delivery attempt yet."}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    Slack:{" "}
                    {form.configuration.lastDelivery.slack ??
                      "No delivery attempt yet."}
                  </Text>
                </Stack>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      )}
      {discardActionContainer ? (
        <Portal container={discardActionContainer}>{discardAction}</Portal>
      ) : (
        discardAction
      )}
      {form.error && (
        <Text role="alert" color="red.fg">
          {form.error}
        </Text>
      )}
      {form.message && (
        <Text role="status" color="green.fg">
          {form.message}
        </Text>
      )}
    </Stack>
  );
}
