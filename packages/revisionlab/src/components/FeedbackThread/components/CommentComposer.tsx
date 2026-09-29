import { useEffect, useRef, useState } from "react";
import {
  Badge,
  Box,
  Button,
  Field,
  Flex,
  Icon,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { Send, X } from "lucide-react";
import { apiRequest } from "../../../client/api.js";
import type {
  RevisionLabElementAnchor,
  RevisionLabPoint,
} from "../../../server/types.js";
import { PinLocationFields } from "./PinLocationFields.js";

interface CommentComposerProps {
  apiPath: string;
  route: string;
  flowId?: string;
  stepId?: string;
  edgeId?: string;
  parentId?: string;
  anchor?: RevisionLabPoint | null;
  elementAnchor?: RevisionLabElementAnchor | null;
  onCancelAnchor?: () => void;
  onAnchorChange?: (point: RevisionLabPoint) => void;
  onSaved: (id: string) => Promise<void>;
}

export function CommentComposer({
  apiPath,
  route,
  flowId,
  stepId,
  edgeId,
  parentId,
  anchor,
  elementAnchor,
  onCancelAnchor,
  onAnchorChange,
  onSaved,
}: CommentComposerProps) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const pending = useRef(false);
  const input = useRef<HTMLTextAreaElement>(null);
  const hasAnchor = Boolean(anchor || elementAnchor);

  useEffect(() => {
    if (hasAnchor || parentId) input.current?.focus({ preventScroll: true });
  }, [hasAnchor, parentId]);

  async function submit() {
    if (!body.trim() || pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ id: string }>(apiPath, "comments", {
        method: "POST",
        body: JSON.stringify({
          body,
          route,
          flowId,
          stepId,
          edgeId,
          parentId,
          ...(anchor ? { anchor } : {}),
          ...(elementAnchor ? { elementAnchor } : {}),
        }),
      });
      setBody("");
      setNotice(parentId ? "Reply added." : "Comment added.");
      await onSaved(result.id);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not save your comment. Try again.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <Stack gap="3">
      {elementAnchor && (
        <Flex align="start" gap="2" justify="space-between">
          <Text fontSize="sm" fontWeight="semibold" overflowWrap="anywhere">
            {elementAnchor.tag}: {elementAnchor.label}
          </Text>
          <Button
            size="xs"
            variant="ghost"
            disabled={busy}
            onClick={onCancelAnchor}
          >
            <Icon>
              <X />
            </Icon>
            Cancel target
          </Button>
        </Flex>
      )}
      {anchor && (
        <Flex align="center" gap="2" justify="space-between" flexWrap="wrap">
          <Badge colorPalette="blue">
            New pin · {Math.round(anchor.x * 100)}%,{" "}
            {Math.round(anchor.y * 100)}%
          </Badge>
          <Button
            size="xs"
            variant="ghost"
            onClick={onCancelAnchor}
            disabled={busy}
          >
            <Icon>
              <X />
            </Icon>
            Cancel pin
          </Button>
        </Flex>
      )}
      {anchor && onAnchorChange && (
        <PinLocationFields
          point={anchor}
          onChange={onAnchorChange}
          disabled={busy}
        />
      )}
      <Box
        as="form"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <Field.Root>
          <Field.Label>
            {parentId
              ? "Your reply"
              : elementAnchor
                ? "Comment on this element"
                : anchor
                  ? "Comment on this area"
                  : "Your comment"}
          </Field.Label>
          <Textarea
            ref={input}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={
              parentId ? "Continue the discussion…" : "What needs attention?"
            }
            maxLength={4000}
            minH="24"
            bg="white"
            borderColor="gray.300"
            disabled={busy}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void submit();
              }
            }}
          />
          {stepId && !anchor && !parentId && (
            <Field.HelperText>
              For a precise location, click an area of the captured screen.
            </Field.HelperText>
          )}
        </Field.Root>
        <Button
          type="submit"
          size="sm"
          colorPalette="blue"
          mt="3"
          loading={busy}
          disabled={!body.trim() || busy}
        >
          <Icon>
            <Send />
          </Icon>
          {parentId
            ? "Reply"
            : elementAnchor
              ? "Post element comment"
              : anchor
                ? "Post pinned comment"
                : "Add comment"}
        </Button>
      </Box>
      {error && (
        <Text role="alert" color="red.700">
          {error}
        </Text>
      )}
      {notice && (
        <Text role="status" fontSize="xs" color="green.700">
          {notice}
        </Text>
      )}
    </Stack>
  );
}
