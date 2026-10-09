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
import type { PersonaTemplate } from "../persona-recommendations.js";
import { PersonaCreateActions } from "./PersonaCreateActions.js";
import type { WorkspaceView } from "./WorkspaceNavigation.js";

export function WorkspaceHeader({
  data,
  view,
  flow,
  actions,
  creationAction,
  creationTriggerRef,
  tabsRef,
  onSignOut,
  signingOut,
}: {
  data: RevisionLabState;
  view: WorkspaceView;
  flow?: RevisionLabFlow;
  actions?: ReactNode;
  creationAction?:
    | {
        kind: "persona";
        apiPath: string;
        disabled: boolean;
        onClick: () => void;
        onSelectTemplate: (template: PersonaTemplate) => void;
      }
    | { kind: "test"; disabled: boolean; onClick: () => void };
  creationTriggerRef?: RefObject<HTMLButtonElement | null>;
  tabsRef?: RefObject<HTMLDivElement | null>;
  onSignOut: () => Promise<void>;
  signingOut: boolean;
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
      borderColor="border"
    >
      <Box flex="1" minW={{ base: "full", md: "48" }}>
        <Flex align="center" gap="3" flexWrap="wrap">
          <Heading
            as="h1"
            size={view === "personas" ? "xl" : "lg"}
            overflowWrap="anywhere"
          >
            {flow?.name ?? workspaceViewTitles[view]}
          </Heading>
          {view === "personas" && (
            <Badge
              aria-label={`${data.personas.filter((persona) => !persona.archivedAt).length} active personas`}
              colorPalette="gray"
              size="lg"
              rounded="full"
            >
              {data.personas.filter((persona) => !persona.archivedAt).length}
            </Badge>
          )}
        </Flex>
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
            <Text color="fg.muted" fontSize="xs">
              {flow.steps.length}{" "}
              {flow.steps.length === 1 ? "screen" : "screens"}
            </Text>
          </Flex>
        ) : (
          <Text fontSize="xs" color="fg.muted">
            {workspaceViewSubtitles[view]}
          </Text>
        )}
      </Box>
      {(actions || creationAction || !data.actor.local) && (
        <Flex gap="3" align="center" flexWrap="wrap" maxW="full" minW="0">
          {actions}
          {creationAction?.kind === "persona" ? (
            <PersonaCreateActions
              apiPath={creationAction.apiPath}
              triggerRef={creationTriggerRef}
              disabled={creationAction.disabled}
              onNew={creationAction.onClick}
              onSelectTemplate={creationAction.onSelectTemplate}
            />
          ) : (
            creationAction && (
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
                color="blue.fg"
                borderColor="blue.border"
                _hover={{ bg: "blue.subtle" }}
                focusRing="outside"
                focusRingColor="blue.focusRing"
                disabled={creationAction.disabled}
                onClick={creationAction.onClick}
              >
                <Icon aria-hidden="true">
                  <Plus />
                </Icon>
                Create a test session
              </Button>
            )
          )}
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
      )}
      {tabsRef && <Box ref={tabsRef} w="full" flexBasis="full" mb="-4" />}
    </Flex>
  );
}
