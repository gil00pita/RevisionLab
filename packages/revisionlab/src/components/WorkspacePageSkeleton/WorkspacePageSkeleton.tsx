import { Box } from "@chakra-ui/react";
import type { WorkspaceSkeletonPage } from "../../workspace-view.js";
import { FeedbackSkeleton } from "./components/FeedbackSkeleton.js";
import { FlowSkeleton } from "./components/FlowSkeleton.js";
import { OverviewSkeleton } from "./components/OverviewSkeleton.js";
import { PersonasSkeleton } from "./components/PersonasSkeleton.js";
import {
  SessionDetailSkeleton,
  SessionsSkeleton,
} from "./components/SessionsSkeleton.js";
import {
  SettingsContentSkeleton,
  SettingsSkeleton,
} from "./components/SettingsSkeleton.js";

export function WorkspacePageSkeleton({
  page,
  variant = "page",
}: {
  page: WorkspaceSkeletonPage;
  variant?: "page" | "content";
}) {
  const unpadded =
    variant === "content" ||
    page === "dashboard" ||
    page === "flows" ||
    page === "flow-screen";
  const sessions = page === "sessions" || page === "session";
  const settings = page === "settings" || page === "settings-users";
  return (
    <Box
      role="status"
      aria-label={`Loading ${page} content`}
      aria-busy="true"
      w="full"
      minW="0"
      bg={page === "personas" ? "bg.subtle" : undefined}
      p={
        unpadded
          ? "0"
          : sessions || settings || page === "personas"
            ? { base: "4", md: "6" }
            : { base: "5", md: "8" }
      }
    >
      <Box aria-hidden="true">
        {page === "dashboard" ? (
          <OverviewSkeleton />
        ) : page === "flows" || page === "flow-screen" ? (
          <FlowSkeleton screen={page === "flow-screen"} />
        ) : sessions ? (
          <SessionsSkeleton detail={page === "session"} />
        ) : page === "session-detail" ? (
          <SessionDetailSkeleton />
        ) : page === "feedback" || page === "feedback-sources" ? (
          <FeedbackSkeleton sources={page === "feedback-sources"} />
        ) : page === "personas" ? (
          <PersonasSkeleton />
        ) : page === "settings" || page === "settings-users" ? (
          <SettingsSkeleton users={page === "settings-users"} />
        ) : (
          <SettingsContentSkeleton page={page} />
        )}
      </Box>
    </Box>
  );
}
