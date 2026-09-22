"use client";

import { useId, useState, type ReactNode, type RefObject } from "react";
import { Box, Button, Flex, Icon, Image, Stack, Text } from "@chakra-ui/react";
import { ImageOff, MessageSquarePlus } from "lucide-react";
import type {
  RevisionLabComment,
  RevisionLabPoint,
  RevisionLabStep,
} from "../../server/types.js";
import { layoutCommentBubbles } from "./bubble-layout.js";
import { ScreenCommentBubbles } from "./components/ScreenCommentBubbles.js";
import { ScreenCommentToolbar } from "./components/ScreenCommentToolbar.js";
import { useImageSize } from "./hooks/useImageSize.js";

interface PinnedScreenProps {
  step: RevisionLabStep;
  comments: RevisionLabComment[];
  anchor: RevisionLabPoint | null;
  selectedCommentId: string | null;
  bubbleOpen: boolean;
  onBubbleOpenChange: (open: boolean) => void;
  discussion: ReactNode;
  pinElements: RefObject<Map<string, HTMLButtonElement>>;
  onImageReadyChange: (ready: boolean) => void;
  onPlace: (point: RevisionLabPoint) => void;
  onSelectComment: (id: string) => void;
}

export function PinnedScreen({
  step,
  comments,
  anchor,
  selectedCommentId,
  bubbleOpen,
  onBubbleOpenChange,
  discussion,
  pinElements,
  onImageReadyChange,
  onPlace,
  onSelectComment,
}: PinnedScreenProps) {
  const instructionsId = useId();
  const [zoom, setZoom] = useState(1);
  const [showResolved, setShowResolved] = useState(false);
  const [showBubbles, setShowBubbles] = useState(true);
  const [commentMode, setCommentMode] = useState(true);
  const [imageState, setImageState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const pins = comments
    .filter((comment) => !comment.parentId && comment.anchor)
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
  const visiblePins = pins.filter(
    (comment) =>
      comment.status !== "resolved" ||
      showResolved ||
      comment.id === selectedCommentId,
  );
  const { imageRef, size } = useImageSize(imageState === "ready");
  const bubbleLayout = layoutCommentBubbles(
    visiblePins.map((comment) => ({ id: comment.id, ...comment.anchor! })),
    size.width,
    size.height,
  );
  const clamp = (value: number) => Math.max(0, Math.min(1, value));

  return (
    <Stack gap="3" minW="0">
      <ScreenCommentToolbar
        instructionsId={instructionsId}
        commentMode={commentMode}
        showBubbles={showBubbles}
        showResolved={showResolved}
        zoom={zoom}
        onToggleCommentMode={() => setCommentMode(!commentMode)}
        onToggleBubbles={() => setShowBubbles(!showBubbles)}
        onToggleResolved={() => setShowResolved(!showResolved)}
        onZoomChange={setZoom}
      />
      {imageState === "error" ? (
        <Stack align="center" py="12" gap="3" color="gray.600">
          <Icon size="xl">
            <ImageOff />
          </Icon>
          <Text role="alert">
            This capture could not be loaded. Refresh the workspace to retry.
          </Text>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setImageState("loading")}
          >
            Retry image
          </Button>
        </Stack>
      ) : (
        <Box
          overflow="auto"
          maxW="full"
          borderWidth="1px"
          borderColor="gray.300"
          borderRadius="lg"
          bg="white"
          p="5"
          maxH="75dvh"
          tabIndex={0}
          aria-label="Captured screen with comment pins"
          focusRing="inside"
        >
          <Box
            position="relative"
            w={`${zoom * 100}%`}
            minH={
              imageState === "loading"
                ? "40"
                : showBubbles
                  ? `${bubbleLayout.height}px`
                  : undefined
            }
          >
            <Box position="relative">
              <Image
                ref={imageRef}
                src={step.screenshot!}
                alt={`Captured screen: ${step.title}`}
                w="full"
                h="auto"
                display="block"
                draggable={false}
                onLoad={() => {
                  setImageState("ready");
                  onImageReadyChange(true);
                }}
                onError={() => {
                  setImageState("error");
                  onImageReadyChange(false);
                }}
              />
              {imageState === "ready" && commentMode && (
                <Button
                  unstyled
                  position="absolute"
                  inset="0"
                  w="full"
                  h="full"
                  display="block"
                  cursor="crosshair"
                  focusRing="inside"
                  aria-label={`Add a comment on ${step.title}`}
                  aria-describedby={instructionsId}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    onPlace(
                      event.detail === 0
                        ? { x: 0.5, y: 0.5 }
                        : {
                            x: clamp((event.clientX - rect.left) / rect.width),
                            y: clamp((event.clientY - rect.top) / rect.height),
                          },
                    );
                  }}
                />
              )}
              {imageState === "ready" && (
                <ScreenCommentBubbles
                  pins={pins}
                  visiblePins={visiblePins}
                  layout={bubbleLayout}
                  showBubbles={showBubbles}
                  selectedCommentId={selectedCommentId}
                  open={bubbleOpen}
                  onOpenChange={onBubbleOpenChange}
                  onSelect={onSelectComment}
                  pinElements={pinElements}
                >
                  {discussion}
                </ScreenCommentBubbles>
              )}
              {imageState === "ready" && anchor && (
                <Flex
                  pointerEvents="none"
                  position="absolute"
                  left={`${anchor.x * 100}%`}
                  top={`${anchor.y * 100}%`}
                  transform="translate(-50%, -50%)"
                  zIndex="2"
                  w="9"
                  h="9"
                  align="center"
                  justify="center"
                  bg="blue.700"
                  color="white"
                  borderWidth="2px"
                  borderColor="white"
                  borderRadius="full"
                  aria-label="New comment location"
                >
                  <Icon>
                    <MessageSquarePlus />
                  </Icon>
                </Flex>
              )}
            </Box>
          </Box>
        </Box>
      )}
    </Stack>
  );
}
