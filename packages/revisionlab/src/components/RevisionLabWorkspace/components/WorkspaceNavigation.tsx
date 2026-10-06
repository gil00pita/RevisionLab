import { Badge, Button, Icon, Link, Stack } from "@chakra-ui/react";
import {
  GitBranch,
  FlaskConical,
  MessageSquare,
  ContactRound,
  ArrowLeft,
  ClipboardList,
} from "lucide-react";
import type { RefObject } from "react";
import { WorkspaceNavigationButton as NavigationButton } from "./WorkspaceNavigationButton.js";
import type { RevisionLabState } from "../../../server/types.js";

export type WorkspaceView =
  "sessions" | "flows" | "comments" | "feedback" | "personas" | "settings";

export function WorkspaceNavigation({
  data,
  prototypeHref,
  view,
  onViewChange,
  flowsTriggerRef,
}: {
  data: RevisionLabState;
  prototypeHref: string;
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
      <Button
        asChild
        colorPalette="blue"
        variant="solid"
        justifyContent="flex-start"
        flexBasis={{ base: "100%", lg: "auto" }}
        mb="2"
      >
        {/* Native navigation preserves the board's pending-save unload warning. */}
        <Link href={prototypeHref} _hover={{ textDecoration: "none" }}>
          <Icon>
            <ArrowLeft />
          </Icon>
          Back to prototype
        </Link>
      </Button>
      <NavigationButton
        buttonRef={flowsTriggerRef}
        active={view === "flows"}
        onClick={() => onViewChange("flows")}
      >
        <Icon>
          <GitBranch />
        </Icon>
        Flows
        <Badge ml="auto" colorPalette="gray" bg="gray.200" color="gray.800">
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
        <Badge ml="auto" colorPalette="gray" bg="gray.200" color="gray.800">
          {
            data.comments.filter(
              (comment) => !comment.parentId && comment.status === "open",
            ).length
          }
        </Badge>
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
