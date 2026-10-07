import type { ReactNode, RefObject } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Text,
} from "@chakra-ui/react";
import { LogOut, Plus } from "lucide-react";
import type {
  RevisionLabFlow,
  RevisionLabState,
} from "../../../server/types.js";
import { workspaceViewSubtitles, workspaceViewTitles } from "../constants.js";
import type { WorkspaceView } from "./WorkspaceNavigation.js";

export function WorkspaceHeader({
  data,
  view,
  flow,
  actions,
  syncControl,
  creationAction,
  creationTriggerRef,
  onSignOut,
  signingOut,
  dashboardScope,
}: {
  data: RevisionLabState;
  view: WorkspaceView;
  flow?: RevisionLabFlow;
  actions?: ReactNode;
  syncControl?: ReactNode;
  creationAction?: {
    kind: "persona" | "test";
    disabled: boolean;
    onClick: () => void;
  };
  creationTriggerRef?: RefObject<HTMLButtonElement | null>;
  onSignOut: () => Promise<void>;
  signingOut: boolean;
  dashboardScope?: string;
}) {
  return (
    <Flex
      as="header"
      minH="20"
      px={{ base: "4", md: "6" }}
      py="4"
      justify="space-between"
      align="center"
      gap="4"
      flexWrap="wrap"
      borderBottomWidth="1px"
      borderColor="gray.200"
    >
      <Box flex="1" minW={{ base: "full", md: "48" }}>
        <Heading as="h1" size="lg" overflowWrap="anywhere">
          {flow?.name ?? workspaceViewTitles[view]}
        </Heading>
        {flow ? (
          <Flex gap="2" mt="2" align="center" flexWrap="wrap">
            {flow.workspace && (
              <Badge colorPalette="purple">{flow.workspace.name}</Badge>
            )}
            <Badge
              colorPalette="blue"
              maxW="full"
              whiteSpace="normal"
              overflowWrap="anywhere"
            >
              {flow.persona}
            </Badge>
            <Badge
              colorPalette={flow.status === "complete" ? "green" : "orange"}
            >
              {flow.status === "complete" ? "Recorded" : "Recording"}
            </Badge>
            <Text color="gray.600" fontSize="xs">
              {flow.steps.length}{" "}
              {flow.steps.length === 1 ? "screen" : "screens"}
            </Text>
          </Flex>
        ) : (
          <Text fontSize="xs" color="gray.600">
            {workspaceViewSubtitles[view]}
          </Text>
        )}
      </Box>
      <Flex gap="3" align="center" flexWrap="wrap" maxW="full" minW="0">
        {view === "dashboard" && dashboardScope && (
          <Badge
            colorPalette="blue"
            maxW="full"
            whiteSpace="normal"
            overflowWrap="anywhere"
          >
            {dashboardScope}
          </Badge>
        )}
        {actions}
        {syncControl}
        {creationAction && (
          <Button
            ref={creationTriggerRef}
            size="sm"
            minH="11"
            h="auto"
            py="2"
            maxW="full"
            whiteSpace="normal"
            colorPalette="blue"
            variant="outline"
            color="blue.700"
            borderColor="blue.600"
            _hover={{ bg: "blue.50" }}
            focusRing="outside"
            focusRingColor="blue.600"
            disabled={creationAction.disabled}
            onClick={creationAction.onClick}
          >
            <Icon aria-hidden="true"><Plus /></Icon>
            {creationAction.kind === "persona" ? "New persona" : "Create a test session"}
          </Button>
        )}
        <Flex gap="2" flexWrap="wrap">
          {!data.actor.local && (
            <Button
              size="sm"
              minH={{ base: "11", lg: "9" }}
              variant="ghost"
              loading={signingOut}
              onClick={() => void onSignOut()}
            >
              <Icon>
                <LogOut />
              </Icon>
              Sign out
            </Button>
          )}
        </Flex>
      </Flex>
    </Flex>
  );
}
