import { useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  Flex,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import type { ReviewEvidence } from "../../../feedback-review.js";
import { ScreenshotImage } from "./ScreenshotImage.js";

export function EvidenceZoomDialog({
  item,
  onClose,
  returnFocus,
}: {
  item: ReviewEvidence | null;
  onClose: () => void;
  returnFocus: () => HTMLElement | null;
}) {
  const [zoom, setZoom] = useState(1);
  return (
    <Dialog.Root
      open={Boolean(item)}
      onOpenChange={(event) => {
        if (!event.open) {
          onClose();
          setZoom(1);
        }
      }}
      size="cover"
      scrollBehavior="inside"
      finalFocusEl={returnFocus}
    >
      <Portal>
        <Dialog.Backdrop data-revisionlab-ui />
        <Dialog.Positioner
          data-revisionlab-ui color="fg" colorPalette="blue"
          padding={{ base: "2", md: "10" }}
        >
          <Dialog.Content
            bg="bg.panel"
            color="fg"
            fontFamily="body"
            colorPalette="blue"
          >
            <Dialog.Header flexDirection="column" gap="2" pe="12">
              <Dialog.Title>Screenshot evidence</Dialog.Title>
              <Dialog.Description>
                {item?.screen ?? item?.route}
                {item?.anchor
                  ? ` · Comment at ${Math.round(item.anchor.x * 100)}%, ${Math.round(item.anchor.y * 100)}%`
                  : item?.target
                    ? ` · ${item.target}`
                    : " · No precise location was saved"}
              </Dialog.Description>
            </Dialog.Header>
            <Dialog.Body>
              {item && (
                <Stack gap="4">
                  <Text whiteSpace="pre-wrap" overflowWrap="anywhere">
                    {item.title}
                  </Text>
                  <Flex gap="2" align="center" flexWrap="wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={zoom <= 1}
                      onClick={() => setZoom(zoom - 0.5)}
                    >
                      Zoom out
                    </Button>
                    <Text role="status">{Math.round(zoom * 100)}%</Text>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={zoom >= 3}
                      onClick={() => setZoom(zoom + 0.5)}
                    >
                      Zoom in
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setZoom(1)}
                    >
                      Fit image
                    </Button>
                  </Flex>
                  <Box
                    maxH="60vh"
                    overflow="auto"
                    borderWidth="1px"
                    borderColor="border.emphasized"
                    rounded="md"
                    tabIndex={0}
                    aria-label="Screenshot viewport"
                    focusRing="outside"
                  >
                    <Box w={`${zoom * 100}%`}>
                      <ScreenshotImage key={item.id} item={item} />
                    </Box>
                  </Box>
                  <Text fontSize="sm" color="fg.muted" overflowWrap="anywhere">
                    {item.route} ·{" "}
                    {item.flowName
                      ? `${item.flowName} · v${item.version}`
                      : "Page comment"}
                  </Text>
                  <Text
                    whiteSpace="pre-wrap"
                    fontSize="sm"
                    overflowWrap="anywhere"
                  >
                    {item.body}
                  </Text>
                </Stack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline">Close screenshot</Button>
              </Dialog.ActionTrigger>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" aria-label="Close screenshot evidence" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
