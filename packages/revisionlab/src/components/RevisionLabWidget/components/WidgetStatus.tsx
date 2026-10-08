import {
  widgetPlacement,
  type WidgetSettings,
} from "../../../widget-settings.js";
import { Box, CloseButton, Link, Stack, Text } from "@chakra-ui/react";
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
  if (!expanded && recorder.recording && !recorder.error) return null;
  if (!recorder.recording && !recorder.error && !recorder.notice) return null;
  return (
    <Box
      data-revisionlab-ui
      position="fixed"
      {...widgetPlacement(settings, true)}
      zIndex="popover"
      maxW="calc(100vw - 1.5rem)"
      w="80"
      bg="bg.panel"
      color="fg"
      px="3"
      py="2"
      borderRadius="md"
      borderWidth="1px"
      borderColor="border"
      pointerEvents={recorder.savedRecording ? "auto" : "none"}
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
            <Text fontSize="xs" lineClamp={1}>
              {recorder.recording.name} · {recorder.recording.count} screens
              {recorder.operation === "capture" ? " · Capturing" : ""}
            </Text>
          )}
          <Text
            fontSize="xs"
            role={recorder.error ? "alert" : "status"}
            color={recorder.error ? "red.fg" : "fg.muted"}
            overflowWrap="anywhere"
          >
            {recorder.error || recorder.notice}
          </Text>
        </>
      )}
    </Box>
  );
}
