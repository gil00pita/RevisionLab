import { Badge, Icon, Stack } from "@chakra-ui/react";
import {
  GitBranch,
  FlaskConical,
  ContactRound,
  LayoutDashboard,
  ClipboardList,
} from "lucide-react";
import type { RefObject } from "react";
import { WorkspaceNavigationButton as NavigationButton } from "./WorkspaceNavigationButton.js";
import type { RevisionLabState } from "../../../server/types.js";

import type { WorkspaceView } from "../../../workspace-view.js";
export type { WorkspaceView } from "../../../workspace-view.js";

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
        active={view === "dashboard"}
        onClick={() => onViewChange("dashboard")}
      >
        <Icon>
          <LayoutDashboard />
        </Icon>
        Overview
      </NavigationButton>
      <NavigationButton
        buttonRef={flowsTriggerRef}
        active={view === "flows"}
        onClick={() => onViewChange("flows")}
      >
        <Icon>
          <GitBranch />
        </Icon>
        Flows
        <Badge ml="auto" colorPalette="blue" bg="blue.subtle" color="blue.fg">
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
        active={view === "feedback"}
        onClick={() => onViewChange("feedback")}
      >
        <Icon>
          <ClipboardList />
        </Icon>
        Feedback Review
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
