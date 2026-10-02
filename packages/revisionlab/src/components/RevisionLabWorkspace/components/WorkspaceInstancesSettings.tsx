import { useState } from "react";
import {
  Badge,
  Button,
  Flex,
  Heading,
  HStack,
  Link,
  Stack,
  Text,
} from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import type { WorkspaceInstance } from "../../../workspace-instances.js";
import {
  WorkspaceInstanceForm,
  type InstanceInput,
} from "./WorkspaceInstanceForm.js";
export function WorkspaceInstancesSettings({
  apiPath,
  workspaces,
  onRefresh,
  onRemoved,
}: {
  apiPath: string;
  workspaces: WorkspaceInstance[];
  onRefresh: () => Promise<void>;
  onRemoved: (id: string) => void;
}) {
  const [editing, setEditing] = useState<WorkspaceInstance | "new" | null>(
    null,
  );
  const [remove, setRemove] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  async function save(input: InstanceInput) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(
        apiPath,
        editing && editing !== "new" ? `instances/${editing.id}` : "instances",
        { method: "POST", body: JSON.stringify(input) },
      );
      setEditing(null);
      await onRefresh();
      setNotice(
        "Workspace connected. Choose it from the sidebar, or select All workspaces.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not connect this workspace.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function disconnect(id: string) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await apiRequest(apiPath, `instances/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ remove: true }),
      });
      setRemove(null);
      onRemoved(id);
      await onRefresh();
      setNotice("Workspace disconnected. Its source data was not changed.");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not remove the connection.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Stack gap="6">
      <Flex justify="space-between" gap="3" flexWrap="wrap">
        <Heading as="h2" size="md">
          Workspace Instances
        </Heading>
        {!editing && (
          <Button
            size="sm"
            colorPalette="blue"
            onClick={() => {
              setEditing("new");
              setError("");
            }}
          >
            Add workspace
          </Button>
        )}
      </Flex>
      <Text color="gray.600">
        Connect live versions of this project. All workspaces brings their
        flows, comments, personas, and saved evidence together; edits are saved
        to their source.
      </Text>
      {editing && (
        <WorkspaceInstanceForm
          key={editing === "new" ? "new" : editing.id}
          instance={editing === "new" ? undefined : editing}
          busy={busy}
          onSave={save}
          onCancel={() => setEditing(null)}
        />
      )}
      {error && (
        <Text role="alert" color="red.700">
          {error}
        </Text>
      )}
      <Text role="status" color="gray.600">
        {notice}
      </Text>
      {workspaces.map((workspace) => (
        <Stack
          key={workspace.id}
          gap="3"
          p="4"
          borderWidth="1px"
          borderColor="border"
          borderRadius="md"
        >
          <Flex gap="3" justify="space-between" flexWrap="wrap">
            <Text fontWeight="semibold" overflowWrap="anywhere">
              {workspace.name}
            </Text>
            <Badge
              colorPalette={
                workspace.status === "unavailable" ? "orange" : "blue"
              }
            >
              {workspace.id === "local"
                ? "Current installation"
                : workspace.status === "unavailable"
                  ? "Unavailable"
                  : "Saved connection"}
            </Badge>
          </Flex>
          <Link
            href={workspace.url}
            target="_blank"
            rel="noopener noreferrer"
            color="blue.700"
            overflowWrap="anywhere"
          >
            {workspace.url}
          </Link>
          {workspace.error && (
            <Text color="orange.800" fontSize="sm">
              {workspace.error}
            </Text>
          )}
          {workspace.id !== "local" &&
            (remove === workspace.id ? (
              <Stack gap="2">
                <Text fontSize="sm">
                  Remove this connection? Data on the source stays unchanged.
                </Text>
                <HStack>
                  <Button
                    size="sm"
                    colorPalette="red"
                    disabled={busy}
                    onClick={() => void disconnect(workspace.id)}
                  >
                    Confirm remove
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setRemove(null)}
                  >
                    Cancel
                  </Button>
                </HStack>
              </Stack>
            ) : (
              <HStack flexWrap="wrap">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => setEditing(workspace)}
                >
                  Update connection
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setRemove(workspace.id)}
                >
                  Remove
                </Button>
              </HStack>
            ))}
        </Stack>
      ))}
    </Stack>
  );
}
