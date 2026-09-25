import { useRef, useState } from "react";
import { Box, Button, Flex, Icon } from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import type {
  RevisionLabFlow,
  RevisionLabState,
} from "../../../server/types.js";
import {
  WorkspaceNavigation,
  type WorkspaceView,
} from "./WorkspaceNavigation.js";
import { FlowList } from "./FlowList.js";

export function WorkspaceSidebar({
  data,
  view,
  selectedFlow,
  onViewChange,
  onFlowSelect,
}: {
  data: RevisionLabState;
  view: WorkspaceView;
  selectedFlow?: RevisionLabFlow;
  onViewChange: (view: WorkspaceView) => Promise<boolean>;
  onFlowSelect: (id: string) => Promise<void>;
}) {
  const [showFlows, setShowFlows] = useState(false);
  const back = useRef<HTMLButtonElement>(null);
  const flows = useRef<HTMLButtonElement>(null);
  async function navigate(next: WorkspaceView) {
    if (!(await onViewChange(next))) return;
    if (next === "flows") {
      setShowFlows(true);
      requestAnimationFrame(() => back.current?.focus());
    }
  }
  return (
    <Box
      as="aside"
      aria-label="Workspace sidebar"
      position={{ base: "relative", lg: "sticky" }}
      top="0"
      alignSelf="start"
      w={{ base: "full", lg: "60" }}
      h={{
        base: showFlows ? "96" : "60",
        md: showFlows ? "96" : "48",
        lg: "100dvh",
      }}
      flexShrink="0"
      overflow="hidden"
      borderRightWidth="1px"
      borderColor="gray.200"
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
        bg="white"
        transform={showFlows ? "translateX(0)" : "translateX(100%)"}
        transitionProperty="transform"
        transitionDuration="moderate"
        _motionReduce={{ transitionDuration: "0s" }}
        inert={!showFlows}
        aria-hidden={!showFlows}
        overflowY="auto"
      >
        <Box p="3" borderBottomWidth="1px" borderColor="gray.200">
          <Button
            ref={back}
            variant="ghost"
            size="sm"
            onClick={() => {
              setShowFlows(false);
              requestAnimationFrame(() => flows.current?.focus());
            }}
          >
            <Icon>
              <ArrowLeft />
            </Icon>
            Back
          </Button>
        </Box>
        <FlowList
          flows={data.flows}
          selected={selectedFlow}
          onSelect={onFlowSelect}
        />
      </Flex>
    </Box>
  );
}
