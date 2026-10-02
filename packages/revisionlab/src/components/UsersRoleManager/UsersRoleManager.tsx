"use client";

import { useState } from "react";
import {
  Alert,
  Badge,
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Input,
  Link,
  NativeSelect,
  Separator,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { apiRequest } from "../../client/api.js";
import type {
  RevisionLabAccessSettings,
  RevisionLabMembership,
  RevisionLabRole,
} from "../../server/types.js";

export function UsersRoleManager({
  apiPath,
  basePath,
  memberships,
  settings,
  onRefresh,
}: {
  apiPath: string;
  basePath: string;
  memberships: RevisionLabMembership[];
  settings: RevisionLabAccessSettings;
  onRefresh: () => Promise<void>;
}) {
  const [systemUrl, setSystemUrl] = useState(settings.systemUrl);
  const [rules, setRules] = useState(settings.allowedEmails.join("\n"));
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
    }
  }

  return (
    <Stack p={{ base: "5", md: "8" }} gap="7" w="full" maxW="5xl">
      <Stack gap="2">
        <Heading as="h2" size="xl">
          Users & roles
        </Heading>
        <Text color="gray.600">
          Manage workspace membership, passwordless access, and default roles.
        </Text>
      </Stack>
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
      <Box
        as="form"
        onSubmit={(event) => {
          event.preventDefault();
          void act(
            "settings",
            async () => {
              await apiRequest(apiPath, "access/settings", {
                method: "PATCH",
                body: JSON.stringify({
                  systemUrl,
                  allowedEmails: rules
                    .split(/\r?\n/)
                    .map((value) => value.trim())
                    .filter(Boolean),
                }),
              });
            },
            "Access settings saved.",
          );
        }}
      >
        <Stack gap="4">
          <Heading as="h3" size="md">
            Access settings
          </Heading>
          <Field.Root required disabled={Boolean(busy)}>
            <Field.Label>
              System URL
              <Field.RequiredIndicator />
            </Field.Label>
            <Input
              type="url"
              value={systemUrl}
              onChange={(event) => setSystemUrl(event.target.value)}
              placeholder="https://review.example.com"
            />
            <Field.HelperText>
              Used for workspace and single-use login links.
            </Field.HelperText>
          </Field.Root>
          <Field.Root disabled={Boolean(busy)}>
            <Field.Label>Allowed self-join emails</Field.Label>
            <Textarea
              rows={4}
              value={rules}
              onChange={(event) => setRules(event.target.value)}
              placeholder={"@company.com\nperson@partner.com"}
            />
            <Field.HelperText>
              One domain beginning with @ or one complete email per line. An
              empty list denies self-join.
            </Field.HelperText>
          </Field.Root>
          <Flex gap="3" flexWrap="wrap">
            <Button
              type="submit"
              colorPalette="blue"
              loading={busy === "settings"}
            >
              Save access settings
            </Button>
            <Button
              type="button"
              variant="outline"
              loading={busy === "code"}
              onClick={() =>
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
            >
              Rotate workspace code
            </Button>
          </Flex>
          {joinUrl && (
            <Text fontSize="sm" color="gray.600">
              Join link:{" "}
              <Link href={joinUrl} color="blue.700">
                {joinUrl}
              </Link>
            </Text>
          )}
          {joinCode && (
            <Alert.Root status="warning">
              <Alert.Content>
                <Alert.Title>Copy this code now</Alert.Title>
                <Alert.Description overflowWrap="anywhere">
                  {joinCode}
                </Alert.Description>
              </Alert.Content>
            </Alert.Root>
          )}
        </Stack>
      </Box>
      <Separator />
      <Box
        as="form"
        onSubmit={(event) => {
          event.preventDefault();
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
          );
        }}
      >
        <Stack gap="4">
          <Heading as="h3" size="md">
            Add a member
          </Heading>
          <Flex gap="3" align="end" direction={{ base: "column", md: "row" }}>
            <Field.Root required disabled={Boolean(busy)} flex="1">
              <Field.Label>
                Email address
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </Field.Root>
            <Field.Root
              required
              disabled={Boolean(busy)}
              maxW={{ base: "full", md: "52" }}
            >
              <Field.Label>Role</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={role}
                  onChange={(event) =>
                    setRole(event.target.value as RevisionLabRole)
                  }
                >
                  <option value="commenter">Commenter</option>
                  <option value="editor">Editor</option>
                  <option value="owner">Owner</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Button
              type="submit"
              colorPalette="blue"
              loading={busy === "add"}
              disabled={!email.trim()}
            >
              Add member
            </Button>
          </Flex>
          {devLoginUrl && (
            <Link href={devLoginUrl} color="blue.700">
              Open local login link
            </Link>
          )}
        </Stack>
      </Box>
      <Separator />
      <Stack gap="3">
        <Heading as="h3" size="md">
          Workspace members
        </Heading>
        {memberships.length === 0 && (
          <Text color="gray.600">No managed members yet.</Text>
        )}
        {memberships.map((member) => (
          <Flex
            key={member.id}
            as="article"
            gap="3"
            align={{ base: "stretch", md: "center" }}
            direction={{ base: "column", md: "row" }}
            py="3"
            borderBottomWidth="1px"
            borderColor="border"
          >
            <Box flex="1" minW="0">
              <Text fontWeight="medium" overflowWrap="anywhere">
                {member.name ?? member.email}
              </Text>
              <Text color="gray.600" fontSize="sm" overflowWrap="anywhere">
                {member.email}
              </Text>
            </Box>
            <Badge
              colorPalette={
                member.status === "active"
                  ? "green"
                  : member.status === "suspended"
                    ? "orange"
                    : "gray"
              }
            >
              {member.status}
            </Badge>
            <NativeSelect.Root
              size="sm"
              w={{ base: "full", md: "40" }}
              disabled={Boolean(busy)}
            >
              <NativeSelect.Field
                aria-label={`Role for ${member.email}`}
                value={member.role}
                onChange={(event) =>
                  void act(
                    member.id,
                    () =>
                      apiRequest(apiPath, `members/${member.id}`, {
                        method: "PATCH",
                        body: JSON.stringify({ role: event.target.value }),
                      }),
                    "Member role updated.",
                  )
                }
              >
                <option value="commenter">Commenter</option>
                <option value="editor">Editor</option>
                <option value="owner">Owner</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <Button
              size="sm"
              variant="outline"
              colorPalette={member.status === "active" ? "orange" : "green"}
              loading={busy === member.id}
              onClick={() =>
                void act(
                  member.id,
                  () =>
                    apiRequest(apiPath, `members/${member.id}`, {
                      method: "PATCH",
                      body: JSON.stringify({
                        status:
                          member.status === "active" ? "suspended" : "active",
                      }),
                    }),
                  member.status === "active"
                    ? "Member suspended."
                    : "Member activated.",
                )
              }
            >
              {member.status === "active" ? "Suspend" : "Activate"}
            </Button>
          </Flex>
        ))}
      </Stack>
    </Stack>
  );
}
