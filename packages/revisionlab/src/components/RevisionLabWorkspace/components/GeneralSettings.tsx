import { WorkspaceApiKeyList } from "./WorkspaceApiKeyList.js";
import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Field,
  Heading,
  HStack,
  Input,
  RadioGroup,
  Stack,
  Text,
} from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import type { WorkspaceApiKey } from "../../../workspace-instances.js";

export function GeneralSettings({
  apiPath,
  projectName,
}: {
  apiPath: string;
  projectName: string;
}) {
  const [keys, setKeys] = useState<WorkspaceApiKey[]>([]);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"editor" | "commenter">("editor");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const load = useCallback(async () => {
    try {
      setKeys(await apiRequest<WorkspaceApiKey[]>(apiPath, "api-keys"));
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not load API keys.",
      );
    }
  }, [apiPath]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  async function generate() {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    setToken("");
    try {
      const result = await apiRequest<WorkspaceApiKey & { token: string }>(
        apiPath,
        "api-keys",
        { method: "POST", body: JSON.stringify({ name, role }) },
      );
      setToken(result.token);
      setName("");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not generate the API key.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function revokeKey(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(apiPath, `api-keys/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ revoked: true }),
      });
      setToken("");
      setNotice("API key revoked. Connections using it no longer have access.");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not revoke the API key.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack gap="6">
      <Heading as="h2" size="md">
        Workspace API keys
      </Heading>
      <Text color="gray.600">
        Generate a key for another {projectName} installation to connect to this
        workspace. Keys grant access to review data, never invitation or API key
        management.
      </Text>
      <Stack
        as="form"
        gap="4"
        onSubmit={(event) => {
          event.preventDefault();
          void generate();
        }}
      >
        <Field.Root required>
          <Field.Label>Key name</Field.Label>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={80}
            placeholder="Design review workspace"
            disabled={busy}
          />
        </Field.Root>
        <Field.Root disabled={busy}>
          <RadioGroup.Root
            value={role}
            onValueChange={(event) =>
              setRole(event.value === "commenter" ? "commenter" : "editor")
            }
            disabled={busy}
            colorPalette="blue"
          >
            <RadioGroup.Label>Connection permissions</RadioGroup.Label>
            <HStack gap="5" flexWrap="wrap" mt="2">
              {(["editor", "commenter"] as const).map((value) => (
                <RadioGroup.Item key={value} value={value}>
                  <RadioGroup.ItemHiddenInput />
                  <RadioGroup.ItemIndicator />
                  <RadioGroup.ItemText>
                    {value === "editor" ? "Editor" : "Commenter"}
                  </RadioGroup.ItemText>
                </RadioGroup.Item>
              ))}
            </HStack>
          </RadioGroup.Root>
          <Field.HelperText>
            Editor can edit review data and settings. Commenter can view and
            discuss. Local user permissions still apply.
          </Field.HelperText>
        </Field.Root>
        <Button
          type="submit"
          alignSelf="start"
          colorPalette="blue"
          loading={busy}
        >
          Generate API key
        </Button>
      </Stack>
      {token && (
        <Stack gap="3" p="4" bg="blue.50" borderRadius="md">
          <Text fontWeight="semibold">
            Copy this key now. It is shown only once.
          </Text>
          <Field.Root>
            <Field.Label>New API key</Field.Label>
            <Input
              value={token}
              readOnly
              fontFamily="mono"
              onFocus={(event) => event.target.select()}
            />
          </Field.Root>
          <HStack>
            <Button
              size="sm"
              onClick={() =>
                void navigator.clipboard
                  .writeText(token)
                  .then(() => setNotice("API key copied."))
                  .catch(() =>
                    setError("Select the API key and copy it manually."),
                  )
              }
            >
              Copy key
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setToken("")}>
              Done
            </Button>
          </HStack>
        </Stack>
      )}
      {error && (
        <Text role="alert" color="red.700">
          {error}
          <Button size="xs" variant="ghost" onClick={() => void load()}>
            Retry
          </Button>
        </Text>
      )}
      <Text role="status" color="gray.600">
        {notice}
      </Text>
      <WorkspaceApiKeyList keys={keys} busy={busy} onRevoke={revokeKey} />
    </Stack>
  );
}
