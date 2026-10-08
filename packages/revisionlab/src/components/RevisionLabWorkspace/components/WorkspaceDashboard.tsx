import { Box, Grid, Heading, SimpleGrid, Stack } from "@chakra-ui/react";
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
import { DashboardResolutionCard } from "./DashboardResolutionCard.js";
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
  const inventoryMetrics = [metrics[3], metrics[4], metrics[6], metrics[7]];
  const current =
    !syncError &&
    syncedAt !== null &&
    stats.sources.length > 0 &&
    stats.sources.every((source) => source.status === "connected");
  return (
    <Grid
      templateColumns={{ base: "minmax(0, 1fr)", xl: "minmax(0, 2.2fr) minmax(0, 1fr)" }}
      bg="bg.panel"
      flex="1"
      minW="0"
      alignItems="start"
    >
      <Stack gap="0" minW="0" px={{ base: "4", md: "6", xl: "8" }}>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap="0" as="section" aria-label="Review statistics" borderBottomWidth="1px" borderColor="border.muted" py="6">
          {reviewMetrics.map((metric, index) => (
            <Box key={metric.label} minW="0" px={{ base: "0", md: index === 0 ? "0" : "5" }} borderLeftWidth={{ base: "0", md: index === 0 ? "0" : "1px" }} borderColor="border.muted">
              <DashboardStatistic {...metric} variant="review" />
            </Box>
          ))}
        </SimpleGrid>
        <Box as="section" aria-labelledby="overview-activity" py="7">
          <Heading id="overview-activity" as="h2" fontSize="md" fontWeight="medium" color="fg" mb="6">Workspace activity</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap="0">
            {inventoryMetrics.map((metric, index) => (
              <Box key={metric.label} minW="0" py="5" pr={{ base: "0", md: index % 2 === 0 ? "6" : "0" }} pl={{ base: "0", md: index % 2 === 1 ? "6" : "0" }} borderTopWidth={index >= 2 ? "1px" : "0"} borderLeftWidth={{ base: "0", md: index % 2 === 1 ? "1px" : "0" }} borderColor="border.muted">
                <DashboardStatistic {...metric} variant="inventory" />
              </Box>
            ))}
          </SimpleGrid>
        </Box>
        <DashboardReviewAcknowledgement comments={stats.comments} resolvedComments={stats.resolvedComments} current={current} onReviewComments={onReviewComments} disabled={navigationDisabled} />
      </Stack>
      <Stack as="section" aria-label="Workspace health" minW="0" gap="0" px={{ base: "4", md: "6" }} py="6" borderLeftWidth={{ base: "0", xl: "1px" }} borderTopWidth={{ base: "1px", xl: "0" }} borderColor="border.muted">
        <DashboardResolutionCard comments={stats.comments} resolvedComments={stats.resolvedComments} current={current} />
        <Box py="6" borderBottomWidth="1px" borderColor="border.muted">
          <DashboardStatistic {...metrics[5]} variant="inventory" />
        </Box>
      </Stack>
    </Grid>
  );
}
