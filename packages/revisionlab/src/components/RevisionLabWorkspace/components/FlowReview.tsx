import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Circle, History, Image as ScreenIcon, Workflow } from "lucide-react";
import { apiRequest } from "../../../client/api.js";
import {
  safePrototypeRoute,
  saveRecording,
} from "../../../client/recording.js";
import type {
  RevisionLabFlow,
  RevisionLabState,
} from "../../../server/types.js";
import { FlowBoard } from "../../FlowBoard/index.js";
import { ScreenReview } from "./ScreenReview.js";

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
  onRecordingTransitionChange,
  beforeLeave,
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
  onRecordingTransitionChange: (pending: boolean) => void;
  beforeLeave: () => Promise<boolean>;
}) {
  const [stepId, setStepId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"board" | "screen">("board");
  const step = flow.steps.find((item) => item.id === stepId) ?? flow.steps[0];
  const versions = data.flows
    .filter((item) => item.familyId === flow.familyId)
    .sort((a, b) => b.version - a.version);
  const canRecord = data.actor.role !== "commenter";

  async function recordVersion() {
    if (busy || navigationPending) return;
    setBusy(true);
    onRecordingTransitionChange(true);
    setError("");
    try {
      if (!(await beforeLeave())) {
        setBusy(false);
        onRecordingTransitionChange(false);
        return;
      }
      let id = flow.id;
      if (flow.status === "complete") {
        const result = await apiRequest<{ id: string }>(
          apiPath,
          `flows/${flow.id}/versions`,
          { method: "POST", body: "{}" },
        );
        id = result.id;
      }
      saveRecording({
        flowId: id,
        name: flow.name,
        persona: flow.persona,
        count: flow.status === "recording" ? flow.steps.length : 0,
        lastRoute: "",
      });
      window.location.assign(safePrototypeRoute(flow.route, basePath));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start this recording.",
      );
      setBusy(false);
      onRecordingTransitionChange(false);
    }
  }

  return (
    <Flex flex="1" direction="column" minW="0">
      <Stack
        gap="3"
        p={{ base: "4", md: "6" }}
        bg="white"
        borderBottomWidth="1px"
        borderColor="gray.200"
      >
        <Flex justify="space-between" gap="4" flexWrap="wrap" align="start">
          <Box>
            <Heading as="h2" size="xl" overflowWrap="anywhere">
              {flow.name}
            </Heading>
            <Flex gap="2" mt="3" flexWrap="wrap">
              <Badge colorPalette="blue">{flow.persona}</Badge>
              <Badge
                colorPalette={flow.status === "complete" ? "green" : "orange"}
              >
                {flow.status === "complete" ? "Recorded" : "Recording"}
              </Badge>
              <Text color="gray.600" fontSize="sm">
                {flow.steps.length}{" "}
                {flow.steps.length === 1 ? "screen" : "screens"}
              </Text>
            </Flex>
          </Box>
          {canRecord && (
            <Button
              size="sm"
              colorPalette="blue"
              onClick={() => void recordVersion()}
              loading={busy}
              disabled={navigationPending}
            >
              <Icon>
                <Circle />
              </Icon>
              {flow.status === "complete"
                ? "Record new version"
                : "Continue recording"}
            </Button>
          )}
        </Flex>
        <Flex gap="2" aria-label="Flow view">
          <Button
            size="sm"
            variant={view === "board" ? "solid" : "outline"}
            aria-pressed={view === "board"}
            onClick={() => setView("board")}
          >
            <Icon>
              <Workflow />
            </Icon>
            Whiteboard
          </Button>
          <Button
            size="sm"
            variant={view === "screen" ? "solid" : "outline"}
            aria-pressed={view === "screen"}
            onClick={() => setView("screen")}
          >
            <Icon>
              <ScreenIcon />
            </Icon>
            Screen & comments
          </Button>
        </Flex>
        <Flex gap="2" align="center" flexWrap="wrap" aria-label="Flow versions">
          <Icon size="sm" color="gray.500">
            <History />
          </Icon>
          {versions.map((version) => (
            <Button
              key={version.id}
              size="xs"
              variant={version.id === flow.id ? "solid" : "ghost"}
              colorPalette={version.id === flow.id ? "blue" : "gray"}
              onClick={() => onFlowSelect(version.id)}
              aria-pressed={version.id === flow.id}
            >
              v{version.version}
            </Button>
          ))}
        </Flex>
        {error && (
          <Text role="alert" color="red.700">
            {error}
          </Text>
        )}
      </Stack>
      <Box display={view === "board" ? "flex" : "none"} flex="1" minW="0">
        <FlowBoard
          flow={flow}
          comments={data.comments}
          apiPath={apiPath}
          canEdit={canRecord}
          navigationPending={busy || navigationPending}
          selectedStepId={step?.id}
          onOpenScreen={(id) => {
            setStepId(id);
            setView("screen");
          }}
          onRefresh={onRefresh}
          onBeforeLeaveChange={onBeforeLeaveChange}
          onDirtyChange={onDirtyChange}
        />
      </Box>
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
    </Flex>
  );
}
