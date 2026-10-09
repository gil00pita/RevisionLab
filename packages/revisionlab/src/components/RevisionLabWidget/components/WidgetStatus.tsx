import {
  widgetPlacement,
  type WidgetSettings,
} from "../../../widget-settings.js";
import { Box, Button, CloseButton, Link, Stack, Text } from "@chakra-ui/react";
import type { useRecording } from "../hooks/useRecording.js";

export function WidgetStatus({
  settings,
  recorder,
  basePath,
  expanded,
}: {
  settings: WidgetSettings;
  recorder: ReturnType<typeof useRecording>;
  basePath: string;
  expanded: boolean;
}) {
  const compact = !expanded && recorder.recording && !recorder.error && !recorder.progress.warning;
  if (!recorder.recording && !recorder.error && !recorder.notice) return null;
  return (
    <Box
      data-revisionlab-ui
      position="fixed"
      {...widgetPlacement(settings, true)}
      zIndex="popover"
      maxW="calc(100vw - 1.5rem)"
      w={compact ? "auto" : "80"}
      bg="bg.panel"
      color="fg"
      px="3"
      py="2"
      borderRadius="md"
      borderWidth="1px"
      borderColor="border"
      pointerEvents={recorder.savedRecording || recorder.error ? "auto" : "none"}
    >
      {recorder.savedRecording ? (
        <Stack gap="2" pr="7" py="1">
          <Text role="status" fontSize="sm" fontWeight="semibold">
            Recording ended and saved.
          </Text>
          <Text fontSize="xs" color="fg.muted" overflowWrap="anywhere">
            {recorder.savedRecording.name}
          </Text>
          <Link
            fontSize="sm"
            color="blue.fg"
            alignSelf="start"
            href={`${basePath}?${new URLSearchParams({ view: "flows", flow: recorder.savedRecording.id })}`}
          >
            View recording
          </Link>
          <CloseButton
            size="xs"
            position="absolute"
            top="2"
            right="2"
            aria-label="Dismiss recording confirmation"
            onClick={recorder.dismissSaved}
          />
        </Stack>
      ) : (
        <>
          {recorder.recording && (
            <Text fontSize="xs" lineClamp={1} role="status">
              {compact ? recorder.progress.phase : `${recorder.recording.name} · ${recorder.recording.count} screens · ${recorder.progress.phase}`}
              {recorder.progress.pending > 0 ? ` · ${recorder.progress.pending} pending` : ""}
            </Text>
          )}
          {!compact && <Text
            fontSize="xs"
            role={recorder.error ? "alert" : "status"}
            color={recorder.error ? "red.fg" : "fg.muted"}
            overflowWrap="anywhere"
          >
            {recorder.error || recorder.progress.warning || recorder.notice}
          </Text>}
          {recorder.progress.error && !recorder.recording?.finishRequested && (
            <Button size="xs" variant="outline" mt="2" onClick={() => void recorder.retry()}>Retry recording uploads</Button>
          )}
        </>
      )}
    </Box>
  );
}
