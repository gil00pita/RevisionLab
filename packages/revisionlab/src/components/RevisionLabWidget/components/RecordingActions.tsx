import { Button, Flex, Icon, Text } from "@chakra-ui/react";
import { Square } from "lucide-react";
import type { useRecording } from "../hooks/useRecording.js";

export function RecordingActions({
  recorder,
  onStop,
  onDiscard,
}: {
  recorder: ReturnType<typeof useRecording>;
  onStop: () => void;
  onDiscard: () => void;
}) {
  const ending =
    recorder.operation === "finish" || recorder.operation === "discard";
  return (
    <>
      <Flex gap="2" flexWrap="wrap">
        <Button
          size="sm"
          colorPalette="blue"
          flex="1"
          loading={recorder.operation === "finish"}
          disabled={ending || recorder.recording?.discardRequested}
          onClick={onStop}
        >
          <Icon>
            <Square />
          </Icon>
          {recorder.recording?.finishRequested && !ending
            ? "Retry saving recording"
            : "Stop recording"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          colorPalette="red"
          disabled={
            ending ||
            Boolean(
              recorder.recording?.finishRequested &&
              recorder.recording.count > 0,
            )
          }
          onClick={onDiscard}
        >
          {recorder.recording?.discardRequested ? "Retry discard" : "Discard"}
        </Button>
      </Flex>
      <Text fontSize="xs" color="gray.600">
        {recorder.recording?.discardRequested
          ? "Recording is stopped. Retry discard to finish removing it."
          : recorder.recording?.finishRequested
            ? "Recording is stopped. Saving must finish before you leave."
            : "Stop saves the captured screens. Discard removes this unfinished recording."}
      </Text>
    </>
  );
}
