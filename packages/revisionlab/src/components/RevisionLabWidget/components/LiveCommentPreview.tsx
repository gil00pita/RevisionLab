import { useState } from "react";
import {
  Box,
  CloseButton,
  Heading,
  Link,
  Popover,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { CommentBubbleColor } from "../../../comment-settings.js";
import { LiveCommentMarker } from "./LiveCommentMarker.js";

export function LiveCommentPreview({
  color,
  visible,
}: {
  color: CommentBubbleColor;
  visible: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Stack gap="3">
      <Heading as="h3" size="sm">
        Live comment preview
      </Heading>
      <Text fontSize="sm" color="fg.muted">
        Select the small comment bubble to open the discussion.
      </Text>
      <Box
        bg="bg.subtle"
        p="5"
        borderWidth="1px"
        borderColor="border"
        borderRadius="lg"
        minH="32"
      >
        <Text fontSize="sm" color="fg.muted" mb="4">
          {visible
            ? "An element on your prototype"
            : "Live comment bubbles are hidden."}
        </Text>
        {visible && (
          <Popover.Root
            open={open}
            onOpenChange={(event) => setOpen(event.open)}
            positioning={{ placement: "bottom-start" }}
          >
            <Popover.Trigger asChild>
              <LiveCommentMarker
                bubbleColor={color}
                count={1}
                aria-label="Show comments: Preview element"
              />
            </Popover.Trigger>
            <Portal>
              <Popover.Positioner
                data-revisionlab-ui
                color="fg"
                colorPalette="blue"
              >
                <Popover.Content
                  aria-label="Page comment preview"
                  w="80"
                  maxW="calc(100vw - 2rem)"
                  bg="bg.panel"
                  color="fg"
                  borderRadius="lg"
                  shadow="md"
                >
                  <Popover.Arrow />
                  <Popover.Header pr="10">
                    <Popover.Title fontSize="sm">Preview element</Popover.Title>
                  </Popover.Header>
                  <Popover.Body>
                    <Stack gap="1">
                      <Text fontSize="xs" color="fg.muted">
                        Sample reviewer
                      </Text>
                      <Text>This is how your live comments will look.</Text>
                    </Stack>
                    <Link
                      href="#revisionlab-setup-heading"
                      color="blue.fg"
                      fontSize="sm"
                      mt="3"
                      onClick={(event) => event.preventDefault()}
                    >
                      Open in workspace
                    </Link>
                  </Popover.Body>
                  <Popover.CloseTrigger asChild>
                    <CloseButton
                      size="sm"
                      position="absolute"
                      top="1"
                      right="1"
                      aria-label="Close comment preview"
                    />
                  </Popover.CloseTrigger>
                </Popover.Content>
              </Popover.Positioner>
            </Portal>
          </Popover.Root>
        )}
      </Box>
    </Stack>
  );
}
