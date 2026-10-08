import type { WorkspaceInstance } from "../../../workspace-instances.js";
import { WorkspaceSelector } from "./WorkspaceSelector.js";
import { useEffect, useRef, useState } from "react";
import { Box, Button, Flex, Icon, Link } from "@chakra-ui/react";
import { AppWindow, ArrowLeft } from "lucide-react";
import type {
  RevisionLabFlow,
  RevisionLabState,
} from "../../../server/types.js";
import {
  WorkspaceNavigation,
  type WorkspaceView,
} from "./WorkspaceNavigation.js";
import { FlowList } from "./FlowList.js";
import { WorkspaceSidebarHeader } from "./WorkspaceSidebarHeader.js";
import { WorkspaceSidebarFooter } from "./WorkspaceSidebarFooter.js";

export function WorkspaceSidebar({
  data,
  workspaces,
  selection,
  onWorkspaceChange,
  view,
  selectedFlow,
  onViewChange,
  onFlowSelect,
  onDeleteFlows,
  disabled,
  syncError,
  apiPath,
  basePath,
  onRefresh,
}: {
  data: RevisionLabState;
  workspaces: WorkspaceInstance[];
  selection: string;
  onWorkspaceChange: (value: string) => void;
  view: WorkspaceView;
  selectedFlow?: RevisionLabFlow;
  onViewChange: (view: WorkspaceView) => Promise<boolean>;
  onFlowSelect: (id: string) => Promise<void>;
  onDeleteFlows: (familyIds: string[]) => Promise<void>;
  disabled: boolean;
  syncError: boolean;
  apiPath: string;
  basePath: string;
  onRefresh: () => Promise<void>;
}) {
  const [showFlows, setShowFlows] = useState(false);
  const back = useRef<HTMLButtonElement>(null);
  const flows = useRef<HTMLButtonElement>(null);
  const previousPanel = useRef(showFlows);
  useEffect(() => {
    if (previousPanel.current === showFlows) return;
    previousPanel.current = showFlows;
    // Wait for React to remove inert from the newly visible panel.
    const frame = requestAnimationFrame(() => {
      (showFlows ? back : flows).current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [showFlows]);
  async function navigate(next: WorkspaceView) {
    if (!(await onViewChange(next))) return;
    setShowFlows(next === "flows");
  }
  return (
    <Flex
      as="aside"
      aria-label="Workspace sidebar"
      position={{ base: "relative", lg: "sticky" }}
      top="0"
      alignSelf="start"
      w={{ base: "full", lg: "60" }}
      h={{ base: "auto", lg: "100dvh" }}
      flexShrink="0"
      overflow="hidden"
      borderRightWidth="1px"
      borderColor="border"
      direction="column"
      bg="bg.panel"
      color="fg"
    >
      <WorkspaceSidebarHeader />
      <WorkspaceSelector
        workspaces={workspaces}
        value={selection}
        disabled={disabled}
        syncError={syncError}
        onChange={onWorkspaceChange}
        canAdd={data.actor.role === "owner"}
        apiPath={apiPath}
        onRefresh={onRefresh}
      />
      <Box px="3" pb="4" flexShrink="0">
        <Button
          asChild
          w="full"
          minH={{ base: "11", lg: "10" }}
          h="auto"
          py="2"
          whiteSpace="normal"
          colorPalette="blue"
          variant="solid"
          justifyContent="flex-start"
          focusRing="inside"
        >
          {/* Native navigation preserves the board's pending-save unload warning. */}
          <Link
            href={
              selection !== "local" && selection !== "all"
                ? (workspaces.find((source) => source.id === selection)?.url ??
                  "/")
                : "/"
            }
            _hover={{ textDecoration: "none" }}
          >
            <Icon asChild>
              <AppWindow />
            </Icon>
            Back to prototype
          </Link>
        </Button>
      </Box>
      <Box
        position="relative"
        flex={{ base: "none", lg: "1" }}
        h={{
          base: showFlows ? "96" : "64",
          sm: showFlows ? "96" : "40",
          md: showFlows ? "96" : "28",
          lg: "auto",
        }}
        minH="0"
        overflow="hidden"
      >
        <Box
          position="absolute"
          inset="0"
          transform={showFlows ? "translateX(-100%)" : "translateX(0)"}
          transitionProperty="transform"
          transitionDuration="moderate"
          _motionReduce={{ transitionDuration: "0s" }}
          inert={showFlows}
          aria-hidden={showFlows}
          overflowY="auto"
        >
          <WorkspaceNavigation
            data={data}
            view={view}
            onViewChange={navigate}
            flowsTriggerRef={flows}
          />
        </Box>
        <Flex
          position="absolute"
          inset="0"
          direction="column"
          bg="bg.panel"
          color="fg"
          transform={showFlows ? "translateX(0)" : "translateX(100%)"}
          transitionProperty="transform"
          transitionDuration="moderate"
          _motionReduce={{ transitionDuration: "0s" }}
          inert={!showFlows}
          aria-hidden={!showFlows}
          overflowY="auto"
        >
          <Box
            p="3"
            flexShrink="0"
            borderBottomWidth="1px"
            borderColor="border"
          >
            <Button
              ref={back}
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => setShowFlows(false)}
            >
              <Icon asChild>
                <ArrowLeft />
              </Icon>
              Main menu
            </Button>
          </Box>
          <FlowList
            flows={data.flows}
            selected={selectedFlow}
            onSelect={onFlowSelect}
            canDelete={data.actor.role !== "commenter"}
            disabled={disabled}
            onDelete={onDeleteFlows}
          />
        </Flex>
      </Box>
      <WorkspaceSidebarFooter
        apiPath={apiPath}
        basePath={basePath}
        actor={data.actor}
        settingsActive={view === "settings"}
        onSettings={() => void navigate("settings")}
        disabled={disabled}
      />
    </Flex>
  );
}
