"use client";

import { useState } from "react";
import { Alert, Separator, Stack, Text } from "@chakra-ui/react";
import { apiRequest } from "../../client/api.js";
import type {
  RevisionLabAccessSettings,
  RevisionLabMembership,
  RevisionLabRole,
} from "../../server/types.js";
import { AccessPolicyForm } from "./components/AccessPolicyForm.js";
import { AddMemberForm } from "./components/AddMemberForm.js";
import { MembershipList } from "./components/MembershipList.js";

export function UsersRoleManager({
  onBusyChange,
  apiPath,
  basePath,
  memberships,
  settings,
  onRefresh,
}: {
  onBusyChange?: (busy: boolean) => void;
  apiPath: string;
  basePath: string;
  memberships: RevisionLabMembership[];
  settings: RevisionLabAccessSettings;
  onRefresh: () => Promise<void>;
}) {
  const [rules, setRules] = useState(() => settings.allowedEmails.join("\n"));
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<RevisionLabRole>("commenter");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [devLoginUrl, setDevLoginUrl] = useState("");
  const joinUrl = settings.systemUrl
    ? `${settings.systemUrl.replace(/\/$/, "")}${basePath}/access`
    : "";

  async function act(
    key: string,
    operation: () => Promise<void>,
    success: string,
  ) {
    if (busy) return;
    setBusy(key);
    onBusyChange?.(true);
    setError("");
    setNotice("");
    try {
      await operation();
      await onRefresh();
      setNotice(success);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The change could not be saved.",
      );
    } finally {
      setBusy("");
      onBusyChange?.(false);
    }
  }

  return (
    <Stack p={{ base: "5", md: "8" }} gap="7" w="full" maxW="5xl">
      <Text color="gray.600">
        Manage workspace membership, passwordless access, and default roles.
      </Text>
      {error && (
        <Alert.Root status="error" role="alert">
          <Alert.Content>
            <Alert.Description>{error}</Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}
      {notice && (
        <Text role="status" color="blue.700" fontSize="sm">
          {notice}
        </Text>
      )}
      <AccessPolicyForm
        rules={rules}
        joinUrl={joinUrl}
        joinCode={joinCode}
        busy={busy}
        onRulesChange={setRules}
        onSave={() =>
          void act(
            "settings",
            () =>
              apiRequest(apiPath, "access/settings", {
                method: "PATCH",
                body: JSON.stringify({
                  systemUrl: settings.systemUrl,
                  allowedEmails: rules
                    .split(/\r?\n/)
                    .map((value) => value.trim())
                    .filter(Boolean),
                }),
              }),
            "Access settings saved.",
          )
        }
        onRotateCode={() =>
          void act(
            "code",
            async () => {
              const result = await apiRequest<{ code: string }>(
                apiPath,
                "access/join-code",
                { method: "POST", body: "{}" },
              );
              setJoinCode(result.code);
            },
            "A new workspace code was created. Previous codes no longer work.",
          )
        }
      />
      <Separator />
      <AddMemberForm
        email={email}
        role={role}
        busy={busy}
        devLoginUrl={devLoginUrl}
        onEmailChange={setEmail}
        onRoleChange={setRole}
        onSubmit={() =>
          void act(
            "add",
            async () => {
              const result = await apiRequest<{ devLoginUrl?: string }>(
                apiPath,
                "members",
                { method: "POST", body: JSON.stringify({ email, role }) },
              );
              setDevLoginUrl(result.devLoginUrl ?? "");
              setEmail("");
            },
            "Member added and login email sent.",
          )
        }
      />
      <Separator />
      <MembershipList
        memberships={memberships}
        busy={busy}
        onRoleChange={(member, nextRole) =>
          void act(
            member.id,
            () =>
              apiRequest(apiPath, `members/${member.id}`, {
                method: "PATCH",
                body: JSON.stringify({ role: nextRole }),
              }),
            "Member role updated.",
          )
        }
        onStatusToggle={(member) =>
          void act(
            member.id,
            () =>
              apiRequest(apiPath, `members/${member.id}`, {
                method: "PATCH",
                body: JSON.stringify({
                  status: member.status === "active" ? "suspended" : "active",
                }),
              }),
            member.status === "active"
              ? "Member suspended."
              : "Member activated.",
          )
        }
      />
    </Stack>
  );
}
