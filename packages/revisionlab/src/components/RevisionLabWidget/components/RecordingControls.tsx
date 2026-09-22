import { Box, Button, Icon, Stack, Text } from "@chakra-ui/react";
import { Camera } from "lucide-react";
import type { useRecording } from "../hooks/useRecording.js";
import { RecordingActions } from "./RecordingActions.js";

export function RecordingControls({
  recorder,
  onStop,
  onDiscard,
}: {
  recorder: ReturnType<typeof useRecording>;
  onStop: () => void;
  onDiscard: () => void;
}) {
  if (!recorder.recording) return null;
  return (
    <Box
      data-revisionlab-ui
      position="fixed"
      bottom="24"
      right={{ base: "4", md: "6" }}
      zIndex="docked"
      w="80"
      maxW="calc(100vw - 2rem)"
      bg="white"
      color="gray.900"
      shadow="md"
      borderRadius="lg"
      p="3"
    >
      <Stack gap="2">
        <Text fontSize="sm" fontWeight="semibold" overflowWrap="anywhere">
          {recorder.recording.discardRequested
            ? "Discard pending"
            : recorder.recording.finishRequested
              ? "Recording stopped"
              : "Recording"}
          : {recorder.recording.name}
        </Text>
        <Text fontSize="xs" color="gray.600" overflowWrap="anywhere">
          {recorder.recording.persona} · {recorder.recording.count}{" "}
          {recorder.recording.count === 1 ? "screen" : "screens"} captured
        </Text>
        <Button
          size="sm"
          variant="outline"
          loading={recorder.operation === "capture"}
          disabled={recorder.busy || !recorder.canCapture}
          onClick={() => void recorder.capture()}
        >
          <Icon>
            <Camera />
          </Icon>
          Capture screen
        </Button>
        <RecordingActions
          recorder={recorder}
          onStop={onStop}
          onDiscard={onDiscard}
        />
        {recorder.error && (
          <Text color="red.700" fontSize="sm" role="alert">
            {recorder.error}
          </Text>
        )}
        <Text fontSize="xs" color="gray.600" role="status">
          {recorder.notice || "Recording in progress"}
        </Text>
      </Stack>
    </Box>
  );
}
