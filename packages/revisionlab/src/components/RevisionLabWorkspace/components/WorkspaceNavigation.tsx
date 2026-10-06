import { Badge, Icon, Stack } from "@chakra-ui/react";
import {
  GitBranch,
  FlaskConical,
  MessageSquare,
  ContactRound,
} from "lucide-react";
import type { RefObject } from "react";
import { WorkspaceNavigationButton as NavigationButton } from "./WorkspaceNavigationButton.js";
import type { RevisionLabState } from "../../../server/types.js";

export type WorkspaceView =
  "sessions" | "flows" | "comments" | "personas" | "settings";

export function WorkspaceNavigation({
  data,
  view,
  onViewChange,
  flowsTriggerRef,
}: {
  data: RevisionLabState;
  view: WorkspaceView;
  onViewChange: (view: WorkspaceView) => void;
  flowsTriggerRef: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Stack
      as="nav"
      aria-label="Workspace"
      direction={{ base: "row", lg: "column" }}
      gap="1"
      px="3"
      pb="4"
      flexWrap="wrap"
    >
      <NavigationButton
        buttonRef={flowsTriggerRef}
        active={view === "flows"}
        onClick={() => onViewChange("flows")}
      >
        <Icon>
          <GitBranch />
        </Icon>
        Flows
        <Badge ml="auto" colorPalette="blue" bg="blue.100" color="blue.800">
          {new Set(data.flows.map((flow) => flow.familyId)).size}
        </Badge>
      </NavigationButton>
      <NavigationButton
        active={view === "sessions"}
        onClick={() => onViewChange("sessions")}
      >
        <Icon>
          <FlaskConical />
        </Icon>
        Test sessions
      </NavigationButton>
      <NavigationButton
        active={view === "comments"}
        onClick={() => onViewChange("comments")}
      >
        <Icon>
          <MessageSquare />
        </Icon>
        Comments
        <Badge ml="auto" colorPalette="blue" bg="blue.100" color="blue.800">
          {
            data.comments.filter(
              (comment) => !comment.parentId && comment.status === "open",
            ).length
          }
        </Badge>
      </NavigationButton>
      <NavigationButton
        active={view === "personas"}
        onClick={() => onViewChange("personas")}
      >
        <Icon>
          <ContactRound />
        </Icon>
        Personas
      </NavigationButton>
    </Stack>
  );
}
