"use client";

import { Alert, Heading, Stack, Text } from "@chakra-ui/react";
import { useState } from "react";
import { apiRequest } from "../../client/api.js";
import type { RevisionLabInvitation } from "../../server/types.js";
import { InvitationForm } from "./components/InvitationForm.js";
import { InvitationList } from "./components/InvitationList.js";
import { InvitationLink } from "./components/InvitationLink.js";

export interface InvitationManagerProps {
  apiPath: string;
  invitations: RevisionLabInvitation[];
  onRefresh: () => Promise<void>;
}

export function InvitationManager({
  apiPath,
  invitations,
  onRefresh,
}: InvitationManagerProps) {
  const [busy, setBusy] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function createInvitation(values: {
    email: string | null;
    role: "commenter" | "editor";
    expiresInDays: number;
  }) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    setInviteUrl("");
    try {
      const result = await apiRequest<{ inviteUrl: string }>(
        apiPath,
        "invitations",
        { method: "POST", body: JSON.stringify(values) },
      );
      setInviteUrl(result.inviteUrl);
      setNotice(
        "Invitation created. Copy the link below and share it with your reviewer.",
      );
      await onRefresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The invitation could not be created. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function revokeInvitation(id: string) {
    if (revoking) return;
    setRevoking(id);
    setError("");
    setNotice("");
    try {
      await apiRequest(apiPath, `invitations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ revoked: true }),
      });
      setInviteUrl("");
      setNotice(
        "Invitation revoked. Its review sessions no longer have access.",
      );
      await onRefresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The invitation could not be revoked. Please try again.",
      );
    } finally {
      setRevoking(null);
    }
  }

  return (
    <Stack
      gap="7"
      as="section"
      aria-labelledby="revisionlab-invitations-heading"
      maxW="3xl"
    >
      <Stack gap="2">
        <Heading as="h2" size="xl" id="revisionlab-invitations-heading">
          Invite reviewers
        </Heading>
        <Text color="gray.600">
          Give colleagues and clients access with an email verification code.
          Each invitation can be revoked at any time.
        </Text>
      </Stack>
      <InvitationForm busy={busy} onSubmit={createInvitation} />
      {error && (
        <Alert.Root status="error" role="alert">
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
      {notice && (
        <Text role="status" fontSize="sm" color="blue.700">
          {notice}
        </Text>
      )}
      {inviteUrl && <InvitationLink value={inviteUrl} />}
      <InvitationList
        invitations={invitations}
        revoking={revoking}
        onRevoke={revokeInvitation}
      />
    </Stack>
  );
}
