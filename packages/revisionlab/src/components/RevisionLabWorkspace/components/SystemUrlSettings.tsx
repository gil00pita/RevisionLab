"use client";

import { useRef, useState } from "react";
import { Box, Button, Field, Heading, Input, Stack, Text } from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabAccessSettings } from "../../../server/types.js";

export function SystemUrlSettings({
  apiPath,
  settings,
  onRefresh,
}: {
  apiPath: string;
  settings: RevisionLabAccessSettings;
  onRefresh: () => Promise<void>;
}) {
  const systemUrl = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  return (
    <Box
      as="form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setError("");
        setSaved(false);
        try {
          await apiRequest(apiPath, "access/settings", {
            method: "PATCH",
            body: JSON.stringify({
              systemUrl: systemUrl.current?.value ?? "",
              allowedEmails: settings.allowedEmails,
            }),
          });
          await onRefresh();
          setSaved(true);
        } catch (cause) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not save the system URL.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <Stack gap="4">
        <Heading as="h3" size="md">
          System URL
        </Heading>
        <Field.Root required disabled={busy} invalid={Boolean(error)}>
          <Field.Label>
            System URL
            <Field.RequiredIndicator />
          </Field.Label>
          <Input
            ref={systemUrl}
            type="url"
            defaultValue={settings.systemUrl}
            placeholder="https://review.example.com"
          />
          <Field.HelperText>
            Used for workspace invitations and single-use login links.
          </Field.HelperText>
          {error && <Field.ErrorText>{error}</Field.ErrorText>}
        </Field.Root>
        <Button
          type="submit"
          colorPalette="blue"
          loading={busy}
          alignSelf="flex-start"
        >
          Save system URL
        </Button>
        <Text role="status" fontSize="sm" color="gray.600" minH="5">
          {saved ? "System URL saved." : ""}
        </Text>
      </Stack>
    </Box>
  );
}
