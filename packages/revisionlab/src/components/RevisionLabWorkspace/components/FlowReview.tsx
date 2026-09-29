import { useState } from "react";
import { Flex, Icon, Tabs } from "@chakra-ui/react";
import { Image as ScreenIcon, Workflow } from "lucide-react";
import type {
  RevisionLabFlow,
  RevisionLabState,
} from "../../../server/types.js";
import { FlowBoard } from "../../FlowBoard/index.js";
import { ScreenReview } from "./ScreenReview.js";
import { FlowVersionMenu } from "./FlowVersionMenu.js";

export function FlowReview({
  data,
  flow,
  apiPath,
  basePath,
  onFlowSelect,
  onRefresh,
  onBeforeLeaveChange,
  onDirtyChange,
  navigationPending,
}: {
  data: RevisionLabState;
  flow: RevisionLabFlow;
  apiPath: string;
  basePath: string;
  onFlowSelect: (id: string) => void;
  onRefresh: () => Promise<void>;
  onBeforeLeaveChange: (handler: (() => Promise<boolean>) | null) => void;
  onDirtyChange: (dirty: boolean) => void;
  navigationPending: boolean;
}) {
  const [stepId, setStepId] = useState<string | null>(null);
  const [view, setView] = useState("board");
  const step = flow.steps.find((item) => item.id === stepId) ?? flow.steps[0];
  const versions = data.flows
    .filter((item) => item.familyId === flow.familyId)
    .sort((a, b) => b.version - a.version);
  const canRecord = data.actor.role !== "commenter";

  return (
    <Tabs.Root
      value={view}
      onValueChange={(event) => setView(event.value)}
      colorPalette="blue"
      size="sm"
      variant="line"
      display="flex"
      flex="1"
      flexDirection="column"
      minW="0"
    >
      <Flex
        px={{ base: "2", md: "6" }}
        gap="1"
        align="center"
        borderBottomWidth="1px"
        borderColor="gray.200"
      >
        <Tabs.List
          aria-label="Flow view"
          borderBottomWidth="0"
          flex="1"
          minW="0"
        >
          <Tabs.Trigger value="board" px={{ base: "2", md: "4" }} gap="2">
            <Icon hideBelow="sm">
              <Workflow />
            </Icon>
            Whiteboard
          </Tabs.Trigger>
          <Tabs.Trigger value="screen" px={{ base: "2", md: "4" }} gap="2">
            <Icon hideBelow="sm">
              <ScreenIcon />
            </Icon>
            Screen &amp; comments
          </Tabs.Trigger>
        </Tabs.List>
        <FlowVersionMenu
          flow={flow}
          versions={versions}
          disabled={navigationPending}
          onSelect={onFlowSelect}
        />
      </Flex>
      <Tabs.Content
        value="board"
        p="0"
        display={view === "board" ? "flex" : "none"}
        flex="1"
        minW="0"
      >
        <FlowBoard
          flow={flow}
          comments={data.comments}
          apiPath={apiPath}
          canEdit={canRecord}
          navigationPending={navigationPending}
          selectedStepId={step?.id}
          onOpenScreen={(id) => {
            setStepId(id);
            setView("screen");
          }}
          onRefresh={onRefresh}
          onBeforeLeaveChange={onBeforeLeaveChange}
          onDirtyChange={onDirtyChange}
        />
      </Tabs.Content>
      <Tabs.Content value="screen" p="0" minW="0">
        {view === "screen" && (
          <ScreenReview
            key={step?.id ?? flow.id}
            flow={flow}
            step={step}
            onSelectStep={setStepId}
            apiPath={apiPath}
            basePath={basePath}
            canResolve={canRecord}
            onRefresh={onRefresh}
            comments={data.comments.filter((comment) =>
              step
                ? comment.stepId === step.id
                : comment.flowId === flow.id &&
                  !comment.stepId &&
                  !comment.edgeId,
            )}
          />
        )}
      </Tabs.Content>
    </Tabs.Root>
  );
}
