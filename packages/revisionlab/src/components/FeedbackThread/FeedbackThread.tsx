"use client";

import { FeedbackCollection } from "./components/FeedbackCollection.js";

import { useState } from "react";
import {
  Badge,
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowLeft } from "lucide-react";
import { apiRequest } from "../../client/api.js";
import type { RevisionLabComment } from "../../server/types.js";
import { CommentComposer } from "./components/CommentComposer.js";
import { CommentMessage } from "./components/CommentMessage.js";
import type { FeedbackThreadProps } from "./types.js";

export function FeedbackThread({
  presentation = "panel",
  collectionItems = [],
  showComposer = true,
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
  renderActions,
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
          <Flex align="center" justify="space-between" gap="2" wrap="wrap">
            <Heading as="h2" size="md">
              {selected ? "Discussion" : "Feedback"}
            </Heading>
            <Badge colorPalette="gray">
              {roots.filter((comment) => comment.status === "open").length} open
            </Badge>
          </Flex>
          <Text fontSize="xs" color="fg.muted" overflowWrap="anywhere">
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
        <Text role="alert" color="red.fg">
          {error}
        </Text>
      )}
      {selected ? (
        <>
          {presentation !== "bubble" && (
            <Button
              alignSelf="start"
              maxW="full"
              minH="11"
              h="auto"
              py="2"
              whiteSpace="normal"
              textAlign="start"
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
            apiPath={apiPath}
            presentation={presentation === "bubble" ? "plain" : "card"}
            comment={selected}
            pinNumber={pinNumber(selected)}
            canResolve={canResolve}
            busy={busy === selected.id}
            onResolve={() => void resolveComment(selected)}
            actions={renderActions?.(selected)}
          />
          {replies.length > 0 && (
            <Stack gap="3" aria-label="Replies">
              <Heading as="h3" size="sm">
                {replies.length} {replies.length === 1 ? "reply" : "replies"}
              </Heading>
              {replies.map((reply) => (
                <CommentMessage
                  apiPath={apiPath}
                  key={reply.id}
                  comment={reply}
                />
              ))}
            </Stack>
          )}
          <Box hidden={!showComposer}>{composer}</Box>
        </>
      ) : (
        <>
          {allowNewComments ? (
            <Box hidden={!showComposer}>{composer}</Box>
          ) : (
            <Text color="fg.muted" fontSize="sm">
              This connection was removed. Existing discussions remain available
              for replies.
            </Text>
          )}
          <FeedbackCollection
            combined={presentation === "collection"}
            showEmpty={presentation !== "collection" || showComposer}
            items={[
              ...roots.map((comment) => ({
                id: comment.id,
                createdAt: comment.createdAt,
                content: (
                  <CommentMessage
                    apiPath={apiPath}
                    comment={comment}
                    pinNumber={pinNumber(comment)}
                    replyCount={comments.filter((reply) => reply.parentId === comment.id).length}
                    canResolve={canResolve}
                    busy={busy === comment.id}
                    onResolve={() => void resolveComment(comment)}
                    onOpen={() => select(comment.id)}
                    actions={renderActions?.(comment)}
                  />
                ),
              })),
              ...collectionItems,
            ]}
          />
        </>
      )}
    </Stack>
  );
}
