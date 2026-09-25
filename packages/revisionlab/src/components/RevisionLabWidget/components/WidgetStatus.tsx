import { Box, CloseButton, Link, Stack, Text } from "@chakra-ui/react";
import type { useRecording } from "../hooks/useRecording.js";

export function WidgetStatus({
  recorder,
  basePath,
}: {
  recorder: ReturnType<typeof useRecording>;
  basePath: string;
}) {
  if (!recorder.recording && !recorder.error && !recorder.notice) return null;
  return (
    <Box
      data-revisionlab-ui
      position="fixed"
      bottom="24"
      right={{ base: "3", md: "6" }}
      zIndex="popover"
      maxW="calc(100vw - 1.5rem)"
      w="80"
      bg="white"
      color="gray.900"
      px="3"
      py="2"
      borderRadius="md"
      borderWidth="1px"
      borderColor="gray.200"
      pointerEvents={recorder.savedRecording ? "auto" : "none"}
    >
      {recorder.savedRecording ? (
        <Stack gap="2" pr="7" py="1">
          <Text role="status" fontSize="sm" fontWeight="semibold">
            Recording ended and saved.
          </Text>
          <Text fontSize="xs" color="gray.600" overflowWrap="anywhere">
            {recorder.savedRecording.name}
          </Text>
          <Link
            fontSize="sm"
            color="blue.700"
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
            color={recorder.error ? "red.700" : "gray.600"}
            overflowWrap="anywhere"
          >
            {recorder.error || recorder.notice}
          </Text>
        </>
      )}
    </Box>
  );
}
