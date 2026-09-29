import { Badge, Button, Icon, Stack } from "@chakra-ui/react";
import {
  GitBranch,
  MessageSquare,
  Users,
  ContactRound,
  Settings,
} from "lucide-react";
import type { RefObject } from "react";
import type { RevisionLabState } from "../../../server/types.js";

export type WorkspaceView =
  "flows" | "comments" | "people" | "personas" | "settings";

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
        <Badge ml="auto" colorPalette="gray" bg="whiteAlpha.200" color="white">
          {new Set(data.flows.map((flow) => flow.familyId)).size}
        </Badge>
      </NavigationButton>
      <NavigationButton
        active={view === "comments"}
        onClick={() => onViewChange("comments")}
      >
        <Icon>
          <MessageSquare />
        </Icon>
        Comments
        <Badge ml="auto" colorPalette="gray" bg="whiteAlpha.200" color="white">
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
      <NavigationButton
        active={view === "settings"}
        onClick={() => onViewChange("settings")}
      >
        <Icon>
          <Settings />
        </Icon>
        Settings
      </NavigationButton>
      {data.actor.role === "owner" && (
        <NavigationButton
          active={view === "people"}
          onClick={() => onViewChange("people")}
        >
          <Icon>
            <Users />
          </Icon>
          Review access
        </NavigationButton>
      )}
    </Stack>
  );
}

function NavigationButton({
  active,
  onClick,
  children,
  buttonRef,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <Button
      ref={buttonRef}
      variant="ghost"
      justifyContent="flex-start"
      bg={active ? "whiteAlpha.200" : "transparent"}
      color="white"
      _hover={{ bg: "whiteAlpha.300" }}
      aria-current={active ? "page" : undefined}
      fontWeight={active ? "semibold" : "normal"}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}
