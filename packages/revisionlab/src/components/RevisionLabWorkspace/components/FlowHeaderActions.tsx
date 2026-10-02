import { useRef, useState } from "react";
import { Button, Flex, Icon, Text } from "@chakra-ui/react";
import { Circle } from "lucide-react";
import { apiRequest } from "../../../client/api.js";
import {
  safePrototypeRoute,
  saveRecording,
} from "../../../client/recording.js";
import type { RevisionLabFlow } from "../../../server/types.js";
import { DeleteFlowAction } from "./DeleteFlowAction.js";

export function FlowHeaderActions({
  flow,
  versions,
  apiPath,
  basePath,
  disabled,
  beforeLeave,
  onRecordingTransitionChange,
  onDeleteFlows,
}: {
  flow: RevisionLabFlow;
  versions: RevisionLabFlow[];
  apiPath: string;
  basePath: string;
  disabled: boolean;
  beforeLeave: () => Promise<boolean>;
  onRecordingTransitionChange: (pending: boolean) => void;
  onDeleteFlows: (familyIds: string[]) => Promise<void>;
}) {
  const running = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function recordVersion() {
    if (running.current || disabled) return;
    running.current = true;
    setBusy(true);
    onRecordingTransitionChange(true);
    setError("");
    try {
      if (!(await beforeLeave())) return;
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
        clickCount:
          flow.status === "recording"
            ? flow.steps.reduce(
                (max, step) =>
                  Math.max(
                    max,
                    ...(step.capture?.cursor.map((point) => point.click ?? 0) ??
                      []),
                  ),
                0,
              )
            : 0,
      });
      window.location.assign(safePrototypeRoute(flow.route, basePath));
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not start this recording.",
      );
    } finally {
      running.current = false;
      setBusy(false);
      onRecordingTransitionChange(false);
    }
  }

  return (
    <Flex gap="2" align="center" flexWrap="wrap" maxW="full">
      <Button
        size="sm"
        colorPalette="blue"
        onClick={() => void recordVersion()}
        loading={busy}
        disabled={disabled}
      >
        <Icon>
          <Circle />
        </Icon>
        {flow.status === "complete"
          ? "Record new version"
          : "Continue recording"}
      </Button>
      <DeleteFlowAction
        flow={flow}
        versions={versions}
        disabled={busy || disabled}
        onDelete={onDeleteFlows}
      />
      {error && (
        <Text
          role="alert"
          color="red.700"
          fontSize="sm"
          flexBasis="full"
          overflowWrap="anywhere"
        >
          {error}
        </Text>
      )}
    </Flex>
  );
}
