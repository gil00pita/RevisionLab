"use client";

import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Field,
  Flex,
  Heading,
  Icon,
  Input,
  Stack,
  Text,
} from "@chakra-ui/react";
import { Camera } from "lucide-react";
import type { RevisionLabPersona } from "../../../server/types.js";
import { RecordingSetup } from "./RecordingSetup.js";
import type { useRecording } from "../hooks/useRecording.js";

export function RecorderPanel({
  recorder,
  personas,
  basePath,
}: {
  recorder: ReturnType<typeof useRecording>;
  personas: RevisionLabPersona[];
  basePath: string;
}) {
  const [title, setTitle] = useState("");

  return (
    <Stack gap="4">
      <Heading as="h3" size="md">
        {recorder.recording ? "Recording your flow" : "Record a flow"}
      </Heading>
      {recorder.recording ? (
        <>
          <Box>
            <Text fontWeight="semibold" overflowWrap="anywhere">
              {recorder.recording.name}
            </Text>
            <Flex gap="2" mt="2" flexWrap="wrap">
              <Badge
                colorPalette="blue"
                whiteSpace="normal"
                overflowWrap="anywhere"
              >
                {recorder.recording.persona}
              </Badge>
              <Badge colorPalette="gray">
                {recorder.recording.count}{" "}
                {recorder.recording.count === 1 ? "screen" : "screens"} captured
              </Badge>
            </Flex>
          </Box>
          <Text color="gray.600">
            Explore the prototype. New routes are captured automatically;
            capture again for a dialog, form, or other state.
          </Text>
          <Field.Root>
            <Field.Label>
              Next screen name{" "}
              <Text as="span" color="gray.600">
                (optional)
              </Text>
            </Field.Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Application confirmation"
              maxLength={160}
              bg="white"
            />
          </Field.Root>
          <Button
            colorPalette="blue"
            loading={recorder.busy}
            disabled={!recorder.canCapture}
            onClick={() => {
              void recorder.capture(undefined, title).then((captured) => {
                if (captured) setTitle("");
              });
            }}
          >
            <Icon>
              <Camera />
            </Icon>
            Capture screen
          </Button>
        </>
      ) : (
        <RecordingSetup
          recorder={recorder}
          personas={personas}
          basePath={basePath}
        />
      )}
      {recorder.error && (
        <Text role="alert" color="red.700">
          {recorder.error}
        </Text>
      )}
      {recorder.notice && (
        <Text role="status" color="green.700" fontSize="xs">
          {recorder.notice}
        </Text>
      )}
    </Stack>
  );
}
