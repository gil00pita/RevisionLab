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
import { DashboardReviewAcknowledgement } from "./DashboardReviewAcknowledgement.js";

export function WorkspaceDashboard({
  data,
  syncedAt,
  syncError,
  onReviewComments,
  navigationDisabled,
}: {
  data: WorkspaceState;
  syncedAt: number | null;
  syncError: boolean;
  onReviewComments: () => void;
  navigationDisabled: boolean;
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
        ? stats.uncheckedScreens === 1
          ? "Automated findings on saved screens. 1 screen has no available check."
          : `Automated findings on saved screens. ${stats.uncheckedScreens.toLocaleString("en")} screens have no available check.`
        : "Automated findings across saved screens and versions.",
    },
    {
      label: "Comments",
      value: stats.comments,
      icon: MessageSquare,
      help: "Comment threads on live pages and recordings. Replies are excluded.",
    },
    {
      label: "Resolved comments",
      value: stats.resolvedComments,
      icon: CircleCheck,
      help: "Comment threads currently marked as resolved.",
    },
    {
      label: "Flows",
      value: stats.flows,
      icon: GitBranch,
      help: "Each recorded flow counts once, including all its versions.",
    },
    {
      label: "Test sessions",
      value: stats.testSessions,
      icon: FlaskConical,
      help: "Includes waiting, live, completed, and expired sessions.",
    },
    {
      label: "Tickets created",
      value: stats.ticketsCreated,
      icon: Ticket,
      help: "Jira drafts do not create tickets. Copy them into Jira manually.",
    },
    {
      label: "Personas",
      value: stats.personas,
      icon: ContactRound,
      help: "Active personas only. Archived personas are excluded.",
    },
    {
      label: "Live URLs",
      value: stats.liveUrls,
      icon: Globe,
      help: "Each prototype site counts once. Includes local development.",
    },
  ];
  const reviewMetrics = metrics.slice(0, 3);
  const inventoryMetrics = metrics.slice(3);
  const current =
    !syncError &&
    syncedAt !== null &&
    stats.sources.length > 0 &&
    stats.sources.every((source) => source.status === "connected");
  return (
    <Stack gap="6" p={{ base: "4", md: "8" }} bg="gray.50" flex="1" minW="0">
      <Stack gap="3">
        <Flex align="center" justify="space-between" gap="4" flexWrap="wrap">
          <Heading as="h2" size={{ base: "2xl", md: "4xl" }} letterSpacing="tight">
            Workspace overview
          </Heading>
          <Badge colorPalette="blue" whiteSpace="normal" overflowWrap="anywhere">
            {scope}
          </Badge>
        </Flex>
        <Text color="gray.600">
          {data.project.name}
        </Text>
      </Stack>
      <DashboardStatus
        sources={stats.sources}
        syncedAt={syncedAt}
        syncError={syncError}
      />
      <SimpleGrid
        columns={{ base: 1, sm: 3 }}
        gap="0"
        bg="blue.950"
        borderRadius="xl"
        p={{ base: "2", md: "3" }}
        as="section"
        aria-label="Review statistics"
      >
        {reviewMetrics.map((metric) => (
          <DashboardStatistic key={metric.label} {...metric} variant="review" />
        ))}
        <DashboardReviewAcknowledgement
          comments={stats.comments}
          resolvedComments={stats.resolvedComments}
          current={current}
          onReviewComments={onReviewComments}
          disabled={navigationDisabled}
        />
      </SimpleGrid>
      <SimpleGrid
        columns={{ base: 1, sm: 2, xl: 5 }}
        gap="0"
        bg="white"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="xl"
        as="section"
        aria-label="Workspace statistics"
      >
        {inventoryMetrics.map((metric) => (
          <DashboardStatistic key={metric.label} {...metric} variant="inventory" />
        ))}
      </SimpleGrid>
    </Stack>
  );
}
