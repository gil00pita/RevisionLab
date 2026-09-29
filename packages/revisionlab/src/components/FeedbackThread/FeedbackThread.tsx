"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { apiRequest } from "../../client/api.js";
import type { RevisionLabComment } from "../../server/types.js";
import { CommentComposer } from "./components/CommentComposer.js";
import { CommentMessage } from "./components/CommentMessage.js";
import type { FeedbackThreadProps } from "./types.js";

export function FeedbackThread({
  presentation = "panel",
  apiPath,
  comments,
  route,
  flowId,
  stepId,
  edgeId,
  allowNewComments = true,
  canResolve,
  onRefresh,
  anchor,
  elementAnchor,
  selectedCommentId,
  onSelectComment,
  onCancelAnchor,
  onAnchorChange,
  onCommentCreated,
}: FeedbackThreadProps) {
  const [localSelection, setLocalSelection] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const roots = comments.filter((comment) => !comment.parentId);
  const selected = roots.find(
    (comment) =>
      comment.id ===
      (selectedCommentId === undefined ? localSelection : selectedCommentId),
  );
  const replies = selected
    ? comments
        .filter((comment) => comment.parentId === selected.id)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [];
  const pins = [...roots]
    .filter((comment) => comment.anchor)
    .sort(
      (a, b) =>
        a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
    );
  const pinNumber = (comment: RevisionLabComment) =>
    comment.anchor
      ? pins.findIndex((pin) => pin.id === comment.id) + 1
      : undefined;

  function select(id: string | null) {
    if (onSelectComment) onSelectComment(id);
    else setLocalSelection(id);
  }

  async function resolveComment(comment: RevisionLabComment) {
    if (busy) return;
    setBusy(comment.id);
    setError("");
    try {
      await apiRequest(apiPath, `comments/${comment.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: comment.status === "open" ? "resolved" : "open",
        }),
      });
      await onRefresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update the discussion.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function saved(id: string) {
    await onRefresh();
    if (!selected) {
      onCommentCreated?.(id);
      if (!onCommentCreated) select(id);
    }
  }

  const composer = (
    <CommentComposer
      key={selected?.id ?? "new"}
      apiPath={apiPath}
      route={route}
      flowId={flowId}
      stepId={stepId}
      edgeId={edgeId}
      parentId={selected?.id}
      anchor={selected ? undefined : anchor}
      elementAnchor={selected ? undefined : elementAnchor}
      onCancelAnchor={onCancelAnchor}
      onAnchorChange={onAnchorChange}
      onSaved={saved}
    />
  );

  return (
    <Stack gap="4" minW="0">
      {presentation === "panel" && (
        <>
          <Flex align="center" justify="space-between" gap="2">
            <Heading as="h2" size="md">
              {selected ? "Discussion" : "Feedback"}
            </Heading>
            <Badge colorPalette="gray">
              {roots.filter((comment) => comment.status === "open").length} open
            </Badge>
          </Flex>
          <Text fontSize="xs" color="gray.600" overflowWrap="anywhere">
            {edgeId
              ? "Comments on this connection"
              : stepId
                ? "Comments on this screen"
                : "Comments on this page"}{" "}
            · {route}
          </Text>
        </>
      )}
      {error && (
        <Text role="alert" color="red.700">
          {error}
        </Text>
      )}
      {selected ? (
        <>
          {presentation === "panel" && (
            <Button
              alignSelf="start"
              variant="ghost"
              size="sm"
              onClick={() => select(null)}
            >
              <Icon>
                <ArrowLeft />
              </Icon>
              {edgeId
                ? "All connection comments"
                : stepId
                  ? "All screen comments"
                  : "All page comments"}
            </Button>
          )}
          <CommentMessage
            presentation={presentation === "bubble" ? "plain" : "card"}
            comment={selected}
            pinNumber={pinNumber(selected)}
            canResolve={canResolve}
            busy={busy === selected.id}
            onResolve={() => void resolveComment(selected)}
          />
          {replies.length > 0 && (
            <Stack gap="3" aria-label="Replies">
              <Heading as="h3" size="sm">
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </Heading>
              {replies.map((reply) => (
                <CommentMessage key={reply.id} comment={reply} />
              ))}
            </Stack>
          )}
          {composer}
        </>
      ) : (
        <>
          {allowNewComments ? (
            composer
          ) : (
            <Text color="gray.600" fontSize="sm">
              This connection was removed. Existing discussions remain available
              for replies.
            </Text>
          )}
          {roots.length ? (
            <Stack gap="4" aria-label="Comments">
              {roots.map((comment) => (
                <CommentMessage
                  key={comment.id}
                  comment={comment}
                  pinNumber={pinNumber(comment)}
                  replyCount={
                    comments.filter((reply) => reply.parentId === comment.id)
                      .length
                  }
                  canResolve={canResolve}
                  busy={busy === comment.id}
                  onResolve={() => void resolveComment(comment)}
                  onOpen={() => select(comment.id)}
                />
              ))}
            </Stack>
          ) : (
            <Stack gap="2" py="6" align="start" color="gray.600">
              <Icon size="lg">
                <MessageSquare />
              </Icon>
              <Text>No feedback yet. Start the conversation.</Text>
            </Stack>
          )}
        </>
      )}
    </Stack>
  );
}
