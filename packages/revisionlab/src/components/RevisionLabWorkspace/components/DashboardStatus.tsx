import { useEffect, useState } from "react";
import { Badge, Flex, Icon, SimpleGrid, Stat, Text } from "@chakra-ui/react";
import { Clock3, Server } from "lucide-react";
import type { WorkspaceInstance } from "../../../workspace-instances.js";
import { relativeSyncTime } from "../dashboard.js";

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
  const status = complete
    ? "Online"
    : online > 0
      ? "Partially available"
      : "Unavailable";
  const localOnly =
    sources.length === 1 &&
    /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(sources[0].url);

  return (
    <SimpleGrid
      columns={{ base: 1, md: 2 }}
      gap="4"
      as="section"
      aria-label="Deployment and sync"
    >
      <Stat.Root
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p="6"
        gap="3"
      >
        <Stat.Label color="gray.600">
          <Flex align="center" gap="2">
            <Icon>
              <Server />
            </Icon>
            Deployment status
          </Flex>
        </Stat.Label>
        <Stat.ValueText fontSize="2xl" fontWeight="semibold">
          {status}
        </Stat.ValueText>
        <Stat.HelpText as="dd" color="gray.600" fontSize="sm">
          {localOnly
            ? "Local development workspace."
            : `${online} of ${sources.length} workspaces reachable.`}{" "}
          Workspace connectivity; deployment builds are not monitored.
        </Stat.HelpText>
        <Flex as="dd" gap="2" flexWrap="wrap">
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
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        p="6"
        gap="3"
      >
        <Stat.Label color="gray.600">
          <Flex align="center" gap="2">
            <Icon>
              <Clock3 />
            </Icon>
            Latest sync
          </Flex>
        </Stat.Label>
        <Stat.ValueText
          fontSize="2xl"
          fontWeight="semibold"
          title={
            syncedAt === null ? undefined : new Date(syncedAt).toLocaleString()
          }
        >
          {relativeSyncTime(syncedAt, now)}
        </Stat.ValueText>
        <Stat.HelpText as="dd" color="gray.600" fontSize="sm">
          {complete
            ? "Last successful refresh of the selected workspace data. Updates automatically."
            : "Waiting for all selected workspaces to sync. Counts may include last-loaded data."}
        </Stat.HelpText>
        <Text as="dd" fontSize="xs" color={complete ? "green.700" : "orange.800"}>
          {complete ? "Automatic sync active" : "Automatic sync will retry"}
        </Text>
      </Stat.Root>
    </SimpleGrid>
  );
}
