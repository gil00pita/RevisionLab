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
import { Camera, Circle } from "lucide-react";
import type { useRecording } from "../hooks/useRecording.js";

export function RecorderPanel({
  recorder,
}: {
  recorder: ReturnType<typeof useRecording>;
}) {
  const [name, setName] = useState("");
  const [persona, setPersona] = useState("");
  const [title, setTitle] = useState("");

  return (
    <Stack gap="4">
      <Heading as="h3" size="md">
        {recorder.recording ? "Recording your flow" : "Record a flow"}
      </Heading>
      {recorder.recording ? (
        <>
          <Box>
            <Text fontWeight="semibold">{recorder.recording.name}</Text>
            <Flex gap="2" mt="2" flexWrap="wrap">
              <Badge colorPalette="blue">{recorder.recording.persona}</Badge>
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
        <Box
          as="form"
          onSubmit={(event) => {
            event.preventDefault();
            void recorder.start(name.trim(), persona.trim());
          }}
        >
          <Stack gap="4">
            <Text color="gray.600">
              Capture a journey as the role or persona you are using in this
              prototype.
            </Text>
            <Field.Root required>
              <Field.Label>
                Flow name
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Submit an application"
                maxLength={120}
                bg="white"
              />
            </Field.Root>
            <Field.Root required>
              <Field.Label>
                Role or persona
                <Field.RequiredIndicator />
              </Field.Label>
              <Input
                value={persona}
                onChange={(event) => setPersona(event.target.value)}
                placeholder="e.g. First-time customer"
                maxLength={120}
                bg="white"
              />
              <Field.HelperText>
                Use the prototype’s own login or role switcher first. This label
                does not change your permissions.
              </Field.HelperText>
            </Field.Root>
            <Text fontSize="xs" color="gray.600">
              Screens may include visible personal data. Password fields and
              areas marked private are excluded. Captures cover up to 4,000
              pixels of page height.
            </Text>
            <Button
              type="submit"
              colorPalette="blue"
              loading={recorder.busy}
              disabled={!name.trim() || !persona.trim()}
            >
              <Icon>
                <Circle />
              </Icon>
              Start recording
            </Button>
          </Stack>
        </Box>
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
