import { Badge, Button, Card, Flex, Icon, Stack, Text } from "@chakra-ui/react";
import { Check, MapPin, MessageSquare, Undo2 } from "lucide-react";
import type { RevisionLabComment } from "../../../server/types.js";

export function CommentMessage({
  presentation = "card",
  comment,
  pinNumber,
  replyCount = 0,
  canResolve = false,
  busy = false,
  onResolve,
  onOpen,
}: {
  presentation?: "card" | "plain";
  comment: RevisionLabComment;
  pinNumber?: number;
  replyCount?: number;
  canResolve?: boolean;
  busy?: boolean;
  onResolve?: () => void;
  onOpen?: () => void;
}) {
  const isPlain = presentation === "plain";
  const showResolve = canResolve && !comment.parentId;

  return (
    <Card.Root
      as="article"
      size="sm"
      variant="outline"
      bg="white"
      borderWidth={isPlain ? "0" : undefined}
      borderColor="gray.300"
      borderRadius={isPlain ? "none" : "xl"}
      overflow={isPlain ? "visible" : "hidden"}
      aria-label={`Comment by ${comment.authorName}`}
    >
      <Card.Header
        px={isPlain ? "0" : undefined}
        pt={isPlain ? "0" : undefined}
      >
        <Flex justify="space-between" gap="2" align="start" flexWrap="wrap">
          <Text
            fontSize="sm"
            fontWeight="semibold"
            color="gray.900"
            overflowWrap="anywhere"
            minW="0"
          >
            {comment.authorName}
          </Text>
          <Flex gap="2" flexWrap="wrap">
            {pinNumber && (
              <Badge colorPalette="blue">
                <Icon>
                  <MapPin />
                </Icon>
                Pin {pinNumber}
              </Badge>
            )}
            {comment.parentId && <Badge colorPalette="gray">Reply</Badge>}
            {!comment.parentId && comment.status === "resolved" && (
              <Badge colorPalette="green">Resolved</Badge>
            )}
          </Flex>
        </Flex>
        <Text fontSize="xs" color="gray.600" overflowWrap="anywhere">
          {new Date(comment.createdAt).toLocaleString()}
        </Text>
      </Card.Header>
      <Card.Body px={isPlain ? "0" : undefined} py={isPlain ? "3" : undefined}>
        <Text
          fontSize="md"
          lineHeight="tall"
          color="gray.900"
          whiteSpace="pre-wrap"
          overflowWrap="anywhere"
        >
          {comment.body}
        </Text>
      </Card.Body>
      {(onOpen || showResolve) && (
        <Card.Footer
          p={isPlain ? "0" : "3"}
          pt={isPlain ? "2" : undefined}
          borderTopWidth="1px"
          borderColor="gray.200"
          bg={isPlain ? "white" : "gray.50"}
        >
          <Stack direction="row" gap="2" flexWrap="wrap">
            {onOpen && (
              <Button size="sm" variant="ghost" onClick={onOpen}>
                <Icon>
                  <MessageSquare />
                </Icon>
                {replyCount
                  ? `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
                  : "Open discussion"}
              </Button>
            )}
            {showResolve && (
              <Button
                size="sm"
                variant="ghost"
                colorPalette={comment.status === "open" ? "green" : "gray"}
                loading={busy}
                onClick={onResolve}
              >
                <Icon>{comment.status === "open" ? <Check /> : <Undo2 />}</Icon>
                {comment.status === "open" ? "Resolve" : "Reopen"}
              </Button>
            )}
          </Stack>
        </Card.Footer>
      )}
    </Card.Root>
  );
}
