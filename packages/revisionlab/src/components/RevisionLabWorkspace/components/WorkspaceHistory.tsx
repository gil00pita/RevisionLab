import { WorkspacePageSkeleton } from "../../WorkspacePageSkeleton/index.js";
import { IllustratedEmptyState } from "../../IllustratedEmptyState/index.js";
import { useCallback, useEffect, useState } from "react";
import {
  Badge,
  Button,
  Flex,
  Heading,
  HStack,
  Stack,
  Text,
} from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import type { RevisionLabRole } from "../../../server/types.js";
import type { WorkspaceHistoryEntry } from "../../../workspace-history.js";
import {
  sourceApiPath,
  sourceCanEdit,
  type WorkspaceInstance,
} from "../../../workspace-instances.js";

interface SourcedHistoryEntry extends WorkspaceHistoryEntry {
  source: WorkspaceInstance;
}

export function WorkspaceHistory({
  apiPath,
  sources,
  actorRole,
  onRefresh,
}: {
  apiPath: string;
  sources: WorkspaceInstance[];
  actorRole: RevisionLabRole;
  onRefresh: () => Promise<void>;
}) {
  const [entries, setEntries] = useState<SourcedHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const unavailable = sources.filter(
    (source) => source.status === "unavailable",
  );
  const load = useCallback(async () => {
    setLoading(true);
    const available = sources.filter(
      (source) => source.status !== "unavailable",
    );
    const results = await Promise.allSettled(
      available.map(async (source) => {
        const result = await apiRequest<{ history: WorkspaceHistoryEntry[] }>(
          sourceApiPath(apiPath, source),
          "history",
        );
        return result.history.map((entry) => ({ ...entry, source }));
      }),
    );
    setEntries(
      results
        .flatMap((result) =>
          result.status === "fulfilled" ? result.value : [],
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
    const failed = results.filter((result) => result.status === "rejected");
    setError(
      failed.length
        ? `${failed.length} workspace${failed.length === 1 ? "" : "s"} could not load history.`
        : "",
    );
    setLoading(false);
  }, [apiPath, sources]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function restore(entry: SourcedHistoryEntry) {
    if (busy || !sourceCanEdit(actorRole, entry.source)) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await apiRequest(
        sourceApiPath(apiPath, entry.source),
        `history/${entry.id}/restore`,
        { method: "POST", body: "{}" },
      );
      setConfirming(null);
      await onRefresh();
      await load();
      setNotice(
        `${entry.source.name} was restored. The restore can also be undone from this history.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not restore this workspace version.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading && entries.length === 0) return <WorkspacePageSkeleton page="history" variant="content" />;

  return (
    <Stack gap="5">
      <Stack gap="2">
        <Heading as="h2" size="md">
          Workspace history
        </Heading>
        <Text color="fg.muted">
          Review changes from the last 30 days. Restoring a version returns that
          source workspace to immediately before the selected change and also
          reverts its later content changes.
        </Text>
        <Text color="fg.muted" fontSize="sm">
          Access, API keys, workspace connections, and the AI instructions Markdown
          file are not included. Saved design-system choices are included.
        </Text>
      </Stack>
      {entries.length === 0 ? (
        <IllustratedEmptyState
          illustration={unavailable.length === sources.length ? "connection" : "documents"}
          description={unavailable.length === sources.length
            ? "History is unavailable while this workspace source is offline."
            : "No recoverable changes in the last 30 days."}
        />
      ) : (
        <Stack gap="3">
          {entries.map((entry) => {
            const canRestore =
              entry.source.status !== "unavailable" &&
              sourceCanEdit(actorRole, entry.source);
            const confirmingThis = confirming === entry.id;
            return (
              <Stack
                key={`${entry.source.id}:${entry.id}`}
                gap="3"
                p="4"
                borderWidth="1px"
                borderColor="border"
                borderRadius="md"
              >
                <Flex gap="3" justify="space-between" flexWrap="wrap">
                  <Stack gap="1">
                    <Text fontWeight="semibold">{entry.action}</Text>
                    <Text fontSize="sm" color="fg.muted">
                      {entry.actorName} ·{" "}
                      {new Date(entry.createdAt).toLocaleString()}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      Available until{" "}
                      {new Date(entry.expiresAt).toLocaleString()}
                    </Text>
                  </Stack>
                  {sources.length > 1 && (
                    <Badge alignSelf="start">{entry.source.name}</Badge>
                  )}
                </Flex>
                {confirmingThis ? (
                  <Stack gap="3" p="3" bg="orange.subtle" borderRadius="md">
                    <Text fontSize="sm" color="orange.fg">
                      Restore {entry.source.name} to before this change? Later
                      content changes in that workspace will also be reverted.
                    </Text>
                    <HStack gap="2" flexWrap="wrap">
                      <Button
                        size="sm"
                        colorPalette="orange"
                        loading={busy}
                        onClick={() => void restore(entry)}
                      >
                        Confirm restore
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setConfirming(null)}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  </Stack>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    alignSelf="start"
                    disabled={!canRestore || busy}
                    onClick={() => setConfirming(entry.id)}
                  >
                    Restore to before this change
                  </Button>
                )}
                {!canRestore && (
                  <Text fontSize="xs" color="fg.muted">
                    Editor permission and an available source workspace are
                    required to restore this version.
                  </Text>
                )}
              </Stack>
            );
          })}
        </Stack>
      )}
      {unavailable.length > 0 && unavailable.length < sources.length && (
        <Text color="orange.fg" fontSize="sm">
          History from {unavailable.map((source) => source.name).join(", ")} is
          unavailable while the source is offline.
        </Text>
      )}
      {error && (
        <Text role="alert" color="red.fg">
          {error}
        </Text>
      )}
      <Text role="status" color="fg.muted" minH="5">
        {notice}
      </Text>
    </Stack>
  );
}
