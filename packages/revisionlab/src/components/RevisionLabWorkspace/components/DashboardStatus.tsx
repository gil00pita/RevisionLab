import { useEffect, useState } from "react";
import { Badge, Flex, Icon, SimpleGrid, Stack, Stat, Text } from "@chakra-ui/react";
import { Clock3, Server } from "lucide-react";
import type { WorkspaceInstance } from "../../../workspace-instances.js";
import { relativeSyncTime } from "../dashboard.js";
import {
  dashboardUpdateEase,
  useDashboardUpdate,
} from "../hooks/useDashboardUpdate.js";

export function DashboardStatus({
  sources,
  syncedAt,
  syncError,
}: {
  sources: WorkspaceInstance[];
  syncedAt: number | null;
  syncError: boolean;
}) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const online = syncError
    ? 0
    : sources.filter((source) => source.status === "connected").length;
  const complete = online === sources.length && online > 0;
  const { ref: syncValue, recentlyUpdated } = useDashboardUpdate(
    syncedAt,
    complete,
  );
  const status = complete
    ? "Connected"
    : online > 0
      ? "Partly connected"
      : "Not connected";
  const exactSyncTime =
    syncedAt === null ? null : new Date(syncedAt).toLocaleString();
  const syncAge = relativeSyncTime(syncedAt, now);
  const localOnly =
    sources.length === 1 &&
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(sources[0].url);
  const connectivityHelp = localOnly
    ? "Local development workspace. Deployment build status is not tracked."
    : `${online.toLocaleString("en")} of ${sources.length.toLocaleString("en")} ${sources.length === 1 ? "workspace" : "workspaces"} connected. Deployment build status is not tracked.`;
  const syncHelp = complete
    ? "Time since all selected workspaces last updated successfully."
    : syncedAt === null
      ? "A full sync has not completed. Some counts may be unavailable."
      : "Some counts may be from earlier updates. This time records the last successful sync of all selected workspaces.";

  return (
    <Stack gap="4">
      <Text
        hideFrom="md"
        fontSize="sm"
        fontWeight="medium"
        lineHeight="tall"
        color="gray.700"
      >
        {status} · Latest sync: {syncAge}
      </Text>
      <SimpleGrid
        columns={{ base: 1, md: 2 }}
        gap={{ base: "6", md: "8" }}
        bg="blue.50"
        borderWidth="1px"
        borderColor="blue.200"
        borderRadius="xl"
        p={{ base: "4", md: "5" }}
        as="section"
        aria-label="Workspace connectivity and sync"
      >
        <Stat.Root
          gap="2"
          minW="0"
          display="grid"
          gridTemplateColumns="repeat(2, minmax(0, 1fr))"
          alignContent="start"
        >
          <Stat.Label color="blue.800" alignSelf="center" lineHeight="moderate">
            <Flex align="center" gap="2">
              <Icon>
                <Server />
              </Icon>
              Deployment connectivity
            </Flex>
          </Stat.Label>
          <Stat.ValueText
            fontSize="xl"
            fontWeight="semibold"
            color="blue.950"
            lineHeight="short"
            textAlign="end"
            overflowWrap="anywhere"
          >
            {status}
          </Stat.ValueText>
          <Stat.HelpText
            as="dd"
            color="blue.800"
            fontSize="xs"
            lineHeight="tall"
            gridColumn="1 / -1"
          >
            {connectivityHelp}
          </Stat.HelpText>
          <Flex as="dd" gap="2" flexWrap="wrap" gridColumn="1 / -1">
            {sources.map((source) => (
              <Badge
                key={source.id}
                colorPalette={
                  source.status === "connected" && !syncError ? "green" : "orange"
                }
                whiteSpace="normal"
                overflowWrap="anywhere"
              >
                {source.name} ·{" "}
                {source.status === "connected" && !syncError
                  ? "Connected"
                  : "Unavailable"}
              </Badge>
            ))}
          </Flex>
        </Stat.Root>
        <Stat.Root
          gap="2"
          minW="0"
          display="grid"
          gridTemplateColumns="repeat(2, minmax(0, 1fr))"
          alignContent="start"
        >
          <Stat.Label color="blue.800" alignSelf="center" lineHeight="moderate">
            <Flex align="center" gap="2">
              <Icon>
                <Clock3 />
              </Icon>
              Latest sync
            </Flex>
          </Stat.Label>
          <Stat.ValueText
            ref={syncValue}
            fontSize="xl"
            fontWeight="semibold"
            color="blue.950"
            bg={recentlyUpdated ? "blue.100" : "transparent"}
            borderRadius="sm"
            lineHeight="short"
            textAlign="end"
            overflowWrap="anywhere"
            transitionProperty="background-color"
            transitionDuration={recentlyUpdated ? "moderate" : "fast"}
            transitionTimingFunction={dashboardUpdateEase}
            _motionReduce={{ transitionDuration: "0s" }}
          >
            {syncAge}
          </Stat.ValueText>
          {exactSyncTime && (
            <Text
              as="dd"
              fontSize="xs"
              lineHeight="tall"
              color="blue.800"
              gridColumn="1 / -1"
              overflowWrap="anywhere"
            >
              Last successful sync: {exactSyncTime}
            </Text>
          )}
          <Stat.HelpText
            as="dd"
            color="blue.800"
            fontSize="xs"
            lineHeight="tall"
            gridColumn="1 / -1"
          >
            {syncHelp}
          </Stat.HelpText>
          <Text
            as="dd"
            fontSize="xs"
            lineHeight="tall"
            gridColumn="1 / -1"
            color={complete ? "green.700" : "orange.800"}
          >
            <Text as="span" role="status" aria-live="polite" aria-atomic="true">
              {complete
                ? "Checks for updates automatically."
                : online > 0
                  ? "Some workspaces are unavailable. Retrying automatically."
                  : "Cannot load workspace data. Retrying automatically."}
            </Text>
          </Text>
        </Stat.Root>
      </SimpleGrid>
    </Stack>
  );
}
