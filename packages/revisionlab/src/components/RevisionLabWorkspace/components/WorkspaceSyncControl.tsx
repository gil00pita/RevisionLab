import { useEffect, useRef, useState } from "react";
import { Button, Icon, Portal, Stack, Text, Tooltip, VisuallyHidden } from "@chakra-ui/react";
import { RefreshCw } from "lucide-react";
import type { WorkspaceInstance } from "../../../workspace-instances.js";
import { relativeSyncTime } from "../dashboard.js";
import { dashboardUpdateEase, useDashboardUpdate } from "../hooks/useDashboardUpdate.js";
import { workspaceConnectionStatus } from "./WorkspaceConnectionStatus.js";

export function WorkspaceSyncControl({
  sources,
  syncedAt,
  syncError,
  onRefresh,
}: {
  sources: WorkspaceInstance[];
  syncedAt: number | null;
  syncError: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [now, setNow] = useState(Date.now);
  const [refreshing, setRefreshing] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const status = workspaceConnectionStatus(sources, syncError);
  const complete = status === "Connected";
  const { ref, recentlyUpdated } = useDashboardUpdate(syncedAt, complete);
  const syncAge = relativeSyncTime(syncedAt, now);
  const exactTime = syncedAt === null
    ? "A full sync has not completed."
    : `Last successful sync: ${new Date(syncedAt).toLocaleString(undefined, { timeZoneName: "short" })}`;

  async function refresh() {
    if (pending.current) return;
    pending.current = true;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      pending.current = false;
      setRefreshing(false);
    }
  }

  return (
    <>
      <Tooltip.Root openDelay={250} positioning={{ placement: "bottom-end" }}>
        <Tooltip.Trigger asChild>
          <Button
            size="sm"
            variant="ghost"
            minH="11"
            h="auto"
            py="2"
            maxW="full"
            whiteSpace="normal"
            color={complete ? "gray.600" : "orange.800"}
            focusRing="outside"
            focusRingColor="blue.600"
            aria-label={`Refresh workspaces. ${complete ? "Latest sync" : "Last synced"}: ${syncAge}`}
            loading={refreshing}
            loadingText="Refreshing"
            onClick={() => void refresh()}
          >
            <Icon aria-hidden="true"><RefreshCw /></Icon>
            <Text
              as="span"
              ref={(node) => { ref.current = node; }}
              bg={recentlyUpdated ? "green.100" : "transparent"}
              borderRadius="sm"
              overflowWrap="anywhere"
              transitionProperty="background-color"
              transitionDuration={recentlyUpdated ? "moderate" : "fast"}
              transitionTimingFunction={dashboardUpdateEase}
              _motionReduce={{ transitionDuration: "0s" }}
            >
              {syncedAt === null ? syncAge : `${complete ? "Synced" : "Last synced"} ${syncAge.toLowerCase()}`}
            </Text>
          </Button>
        </Tooltip.Trigger>
        <Portal>
          <Tooltip.Positioner data-revisionlab-ui zIndex="tooltip">
            <Tooltip.Content maxW="calc(100vw - 2rem)" overflowWrap="anywhere">
              <Stack gap="1">
                <Text>{exactTime}</Text>
                <Text>
                  {complete
                    ? "All selected workspaces updated successfully. Click to refresh."
                    : "Some data may be unavailable or from earlier updates. Click to retry; automatic retries continue."}
                </Text>
              </Stack>
            </Tooltip.Content>
          </Tooltip.Positioner>
        </Portal>
      </Tooltip.Root>
      <VisuallyHidden role="status" aria-live="polite" aria-atomic="true">
        {status}. {refreshing
          ? "Refreshing workspace data."
          : complete
            ? "Checks for updates automatically."
            : "Some data may be unavailable or from earlier updates. Retrying automatically."}
      </VisuallyHidden>
    </>
  );
}
