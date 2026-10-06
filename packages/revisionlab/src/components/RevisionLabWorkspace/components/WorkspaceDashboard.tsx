import {
  Badge,
  Flex,
  Heading,
  SimpleGrid,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  Accessibility,
  CircleCheck,
  ContactRound,
  FlaskConical,
  GitBranch,
  Globe,
  MessageSquare,
  Ticket,
} from "lucide-react";
import type { WorkspaceState } from "../../../workspace-instances.js";
import { dashboardStatistics } from "../dashboard.js";
import { DashboardStatistic } from "./DashboardStatistic.js";
import { DashboardStatus } from "./DashboardStatus.js";

export function WorkspaceDashboard({
  data,
  syncedAt,
  syncError,
}: {
  data: WorkspaceState;
  syncedAt: number | null;
  syncError: boolean;
}) {
  const stats = dashboardStatistics(data);
  const scope =
    data.selection === "all"
      ? "All workspaces"
      : (stats.sources[0]?.name ?? "This workspace");
  const metrics = [
    {
      label: "Accessibility issues",
      value: stats.accessibilityIssues,
      icon: Accessibility,
      help: stats.uncheckedScreens
        ? `Across saved screens · ${stats.uncheckedScreens} ${stats.uncheckedScreens === 1 ? "screen" : "screens"} without available checks`
        : "Detected violations across saved screens and versions",
    },
    {
      label: "Comments",
      value: stats.comments,
      icon: MessageSquare,
      help: "Comment threads across live pages and recordings",
    },
    {
      label: "Resolved comments",
      value: stats.resolvedComments,
      icon: CircleCheck,
      help: "Threads marked as resolved",
    },
    {
      label: "Flows",
      value: stats.flows,
      icon: GitBranch,
      help: "Recorded journeys, with versions grouped together",
    },
    {
      label: "Test sessions",
      value: stats.testSessions,
      icon: FlaskConical,
      help: "All waiting, live, completed, and expired sessions",
    },
    {
      label: "Tickets created",
      value: stats.ticketsCreated,
      icon: Ticket,
      help: "Created by RevisionLab · Jira drafts are copied manually",
    },
    {
      label: "Personas",
      value: stats.personas,
      icon: ContactRound,
      help: "Active personas available for recordings",
    },
    {
      label: "Live URLs",
      value: stats.liveUrls,
      icon: Globe,
      help: "Distinct prototype URLs in the selected workspaces",
    },
  ];
  return (
    <Stack gap="8" p={{ base: "5", md: "8" }} bg="gray.50" flex="1" minW="0">
      <Stack gap="2">
        <Flex align="center" gap="3" flexWrap="wrap">
          <Heading as="h2" size="xl">
            Workspace overview
          </Heading>
          <Badge colorPalette="blue">{scope}</Badge>
        </Flex>
        <Text color="gray.600">
          {data.project.name} · Review activity across your workspace.
        </Text>
      </Stack>
      <SimpleGrid
        columns={{ base: 1, sm: 2, xl: 4 }}
        gap="4"
        as="section"
        aria-label="Workspace statistics"
      >
        {metrics.map((metric) => (
          <DashboardStatistic key={metric.label} {...metric} />
        ))}
      </SimpleGrid>
      <DashboardStatus
        sources={stats.sources}
        syncedAt={syncedAt}
        syncError={syncError}
      />
    </Stack>
  );
}
