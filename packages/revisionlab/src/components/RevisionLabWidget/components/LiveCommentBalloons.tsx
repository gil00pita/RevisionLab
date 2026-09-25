import { useRef, useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Icon,
  Link,
  Popover,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { MessageSquare } from "lucide-react";
import type { RevisionLabComment } from "../../../server/types.js";
import { useLiveCommentTargets } from "../hooks/useLiveCommentTargets.js";
import {
  commentBubbleTokens,
  type CommentBubbleColor,
} from "../../../comment-settings.js";

export function LiveCommentBalloons({
  comments,
  commentsHref,
  color,
}: {
  comments: RevisionLabComment[];
  commentsHref: string;
  color: CommentBubbleColor;
}) {
  const colors = commentBubbleTokens(color);
  const targets = useLiveCommentTargets(comments);
  const [selected, setSelected] = useState<string | null>(null);
  const boundary = useRef<HTMLDivElement>(null);
  const active = targets.find((target) => target.id === selected);
  const visibleComments = comments.filter((comment) =>
    active?.ids.includes(comment.id),
  );
  return (
    <Popover.Root
      open={Boolean(active)}
      triggerValue={active?.id ?? null}
      onTriggerValueChange={(event) => setSelected(event.value)}
      onOpenChange={(event) => {
        if (!event.open) setSelected(null);
      }}
      autoFocus={false}
      restoreFocus={false}
      closeOnInteractOutside={false}
      closeOnEscape={false}
      positioning={{
        placement: "bottom-start",
        strategy: "fixed",
        gutter: 8,
        boundary: () => boundary.current ?? "clippingAncestors",
        overflowPadding: 8,
      }}
    >
      <Portal>
        {active && (
          <Box
            data-revisionlab-ui
            data-revisionlab-comment-highlight
            aria-hidden
            position="fixed"
            pointerEvents="none"
            zIndex="overlay"
            left={`${active.bounds.x}px`}
            top={`${active.bounds.y}px`}
            width={`${active.bounds.width}px`}
            height={`${active.bounds.height}px`}
            borderWidth="2px"
            borderStyle="solid"
            borderColor={colors.outline}
            bg={colors.tint}
          />
        )}
        <Box
          ref={boundary}
          data-revisionlab-ui
          aria-hidden
          position="fixed"
          top="0"
          left="0"
          right="0"
          bottom="60"
          pointerEvents="none"
        />
        {targets.map((target) => (
          <Popover.Trigger key={target.id} value={target.id} asChild>
            <Button
              data-revisionlab-ui
              position="fixed"
              left={`${target.x}px`}
              top={`${target.y}px`}
              zIndex="modal"
              h="8"
              minW="8"
              size="xs"
              borderRadius="full"
              colorPalette={color}
              bg={colors.solid}
              color={colors.contrast}
              borderWidth="1px"
              borderColor={colors.outline}
              _hover={{ bg: colors.hover }}
              focusRingColor={colors.outline}
              aria-label={`Show comments: ${target.label}`}
              title={`Show comments: ${target.label}`}
            >
              <Icon>
                <MessageSquare />
              </Icon>
              {target.ids.length}
            </Button>
          </Popover.Trigger>
        ))}
        <Popover.Positioner data-revisionlab-ui>
          <Popover.Content
            aria-label="Page comment preview"
            w="80"
            maxW="calc(100vw - 2rem)"
            bg="white"
            color="gray.900"
            borderRadius="lg"
            shadow="md"
          >
            <Popover.Arrow />
            <Popover.Header pr="10">
              <Popover.Title fontSize="sm" lineClamp={2}>
                {active?.label}
              </Popover.Title>
            </Popover.Header>
            <Popover.Body>
              <Stack gap="3" maxH="min(30dvh, 240px)" overflowY="auto">
                {visibleComments.map((comment) => (
                  <Stack key={comment.id} gap="1">
                    <Text fontSize="xs" color="gray.600">
                      {comment.authorName}
                    </Text>
                    <Text
                      fontSize="sm"
                      whiteSpace="pre-wrap"
                      overflowWrap="anywhere"
                    >
                      {comment.body}
                    </Text>
                  </Stack>
                ))}
              </Stack>
              <Link href={commentsHref} color="blue.700" fontSize="sm" mt="3">
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
  );
}
