import { useRef, type ReactNode, type RefObject } from "react";
import {
  Button,
  CloseButton,
  Flex,
  Popover,
  Portal,
  useBreakpointValue,
} from "@chakra-ui/react";
import type { RevisionLabComment } from "../../../server/types.js";
import type { layoutCommentBubbles } from "../bubble-layout.js";
import { CommentBubblePreview } from "./CommentBubblePreview.js";

export function ScreenCommentBubbles({
  pins,
  visiblePins,
  layout,
  showBubbles,
  selectedCommentId,
  open,
  onOpenChange,
  onSelect,
  pinElements,
  children,
}: {
  pins: RevisionLabComment[];
  visiblePins: RevisionLabComment[];
  layout: ReturnType<typeof layoutCommentBubbles>;
  showBubbles: boolean;
  selectedCommentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (id: string) => void;
  pinElements: RefObject<Map<string, HTMLButtonElement>>;
  children: ReactNode;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const narrow = useBreakpointValue({ base: true, md: false }) ?? true;
  const selectedNumber =
    pins.findIndex((pin) => pin.id === selectedCommentId) + 1;

  return (
    <Popover.Root
      open={open}
      triggerValue={selectedCommentId}
      onTriggerValueChange={({ value }) => {
        if (value) onSelect(value);
      }}
      onOpenChange={({ open }) => onOpenChange(open)}
      lazyMount
      size="sm"
      initialFocusEl={() => closeButton.current}
      positioning={{
        placement: narrow ? "bottom" : "right-start",
        strategy: "fixed",
        gutter: 16,
        overflowPadding: 12,
        flip: narrow
          ? ["bottom", "top"]
          : ["right-start", "left-start", "bottom", "top"],
        slide: true,
        hideWhenDetached: true,
      }}
    >
      {visiblePins.map((comment) => {
        const number = pins.findIndex((pin) => pin.id === comment.id) + 1;
        const selected = open && comment.id === selectedCommentId;
        return (
          <Popover.Trigger key={comment.id} value={comment.id} asChild>
            <Button
              ref={(element) => {
                if (element) pinElements.current.set(comment.id, element);
                else pinElements.current.delete(comment.id);
              }}
              size="sm"
              minW="9"
              w="9"
              h="9"
              p="0"
              position="absolute"
              zIndex="3"
              left={`${comment.anchor!.x * 100}%`}
              top={`${comment.anchor!.y * 100}%`}
              transform="translate(-50%, -50%)"
              borderRadius="full"
              borderWidth="2px"
              borderColor="white"
              colorPalette={comment.status === "resolved" ? "green" : "blue"}
              outlineWidth={selected ? "2px" : "0"}
              outlineStyle="solid"
              outlineColor="blue.700"
              outlineOffset="2px"
              aria-label={`Pin ${number}: ${comment.body.slice(0, 90)}${comment.status === "resolved" ? " (resolved)" : ""}`}
              aria-pressed={selected}
            >
              {number}
            </Button>
          </Popover.Trigger>
        );
      })}
      {showBubbles &&
        visiblePins.map((comment) => {
          const placement = layout.items.find((item) => item.id === comment.id);
          if (!placement) return null;
          return (
            <CommentBubblePreview
              key={comment.id}
              comment={comment}
              number={pins.findIndex((pin) => pin.id === comment.id) + 1}
              placement={placement}
              selected={open && selectedCommentId === comment.id}
              onOpen={() => {
                // Displaced previews can remain visible after their pin scrolls away.
                pinElements.current
                  .get(comment.id)
                  ?.scrollIntoView({ block: "nearest", inline: "nearest" });
                onSelect(comment.id);
                onOpenChange(true);
              }}
            />
          );
        })}
      <Portal>
        <Popover.Positioner
          data-revisionlab-ui
          colorPalette="blue"
          color="gray.900"
          fontFamily="body"
          zIndex="popover"
        >
          <Popover.Content
            aria-label={`Pin ${selectedNumber} discussion`}
            w="sm"
            maxW="calc(100dvw - 24px)"
            maxH={{ base: "40dvh", md: "min(36rem, 65dvh)" }}
            borderRadius="xl"
            _motionReduce={{ animation: "none" }}
          >
            <Popover.Arrow>
              <Popover.ArrowTip borderColor="gray.200" />
            </Popover.Arrow>
            <Popover.Header
              pb="3"
              borderBottomWidth="1px"
              borderColor="gray.200"
            >
              <Flex align="center" justify="space-between" gap="3">
                <Popover.Title fontWeight="semibold">
                  Pin {selectedNumber} discussion
                </Popover.Title>
                <Popover.CloseTrigger asChild>
                  <CloseButton
                    ref={closeButton}
                    size="sm"
                    aria-label="Close comment discussion"
                  />
                </Popover.CloseTrigger>
              </Flex>
            </Popover.Header>
            <Popover.Body
              minH="0"
              overflowY="auto"
              overscrollBehavior="contain"
            >
              {children}
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
