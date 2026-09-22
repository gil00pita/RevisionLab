import { Badge, Box, Button, Flex, Text } from "@chakra-ui/react";
import type { RevisionLabComment } from "../../../server/types.js";
import type { layoutCommentBubbles } from "../bubble-layout.js";

type BubblePlacement = ReturnType<typeof layoutCommentBubbles>["items"][number];

export function CommentBubblePreview({
  comment,
  number,
  placement,
  selected,
  onOpen,
}: {
  comment: RevisionLabComment;
  number: number;
  placement: BubblePlacement;
  selected: boolean;
  onOpen: () => void;
}) {
  const { x, y, width, height, anchorX, anchorY, tailX, tailY } = placement;
  const distance = Math.hypot(tailX - anchorX, tailY - anchorY);
  const angle = Math.atan2(tailY - anchorY, tailX - anchorX);

  return (
    <>
      <Box
        aria-hidden="true"
        pointerEvents="none"
        position="absolute"
        zIndex="1"
        left={`${anchorX}px`}
        top={`${anchorY}px`}
        w={`${distance}px`}
        h="0.5"
        bg="blue.600"
        transformOrigin="left center"
        transform={`rotate(${angle}rad)`}
      />
      <Box
        aria-hidden="true"
        pointerEvents="none"
        position="absolute"
        zIndex="1"
        left={`${tailX}px`}
        top={`${tailY}px`}
        w="3"
        h="3"
        bg="white"
        borderWidth="1px"
        borderColor={selected ? "blue.600" : "gray.400"}
        transform="translate(-50%, -50%) rotate(45deg)"
      />
      <Button
        unstyled
        position="absolute"
        zIndex="2"
        left={`${x}px`}
        top={`${y}px`}
        w={`${width}px`}
        h={`${height}px`}
        display="flex"
        flexDirection="column"
        alignItems="stretch"
        gap="2"
        p="3"
        textAlign="left"
        whiteSpace="normal"
        bg="white"
        color="gray.900"
        borderWidth="1px"
        borderColor={selected ? "blue.600" : "gray.400"}
        borderRadius="xl"
        cursor="pointer"
        focusRing="outside"
        _hover={{ bg: "blue.50", borderColor: "blue.600" }}
        aria-label={`Open comment bubble ${number}: ${comment.body.slice(0, 90)}`}
        aria-haspopup="dialog"
        aria-expanded={selected}
        onClick={onOpen}
      >
        <Flex gap="2" align="center" minW="0">
          <Badge
            colorPalette={comment.status === "resolved" ? "green" : "blue"}
          >
            {number}
          </Badge>
          <Text as="span" fontSize="sm" fontWeight="semibold" truncate minW="0">
            {comment.authorName}
          </Text>
          {comment.status === "resolved" && (
            <Badge colorPalette="green">Resolved</Badge>
          )}
        </Flex>
        <Text
          as="span"
          fontSize="sm"
          lineHeight="tall"
          whiteSpace="pre-wrap"
          overflowWrap="anywhere"
          lineClamp="3"
        >
          {comment.body}
        </Text>
      </Button>
    </>
  );
}
