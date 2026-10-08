import { CommentInput, useCommentDraft } from "../../CommentInput/index.js";
import { useEffect, useRef, useState } from "react";
import { Badge, Box, Button, Flex, Icon, Stack, Text } from "@chakra-ui/react";
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
  const draft = useCommentDraft(apiPath);
  const { body, setBody } = draft;
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
    if (
      (!body.trim() && !draft.files.length) ||
      draft.preparing ||
      pending.current
    )
      return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await apiRequest<{ id: string }>(apiPath, "comments", {
        method: "POST",
        body: JSON.stringify({
          body: body.trim(),
          ...draft.payload(),
          route,
          flowId,
          stepId,
          edgeId,
          parentId,
          ...(anchor ? { anchor } : {}),
          ...(elementAnchor ? { elementAnchor } : {}),
        }),
      });
      draft.reset();
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
        <CommentInput
          draft={draft}
          apiPath={apiPath}
          route={route}
          inputRef={input}
          value={body}
          onChange={setBody}
          label={
            parentId
              ? "Your reply"
              : elementAnchor
                ? "Comment on this element"
                : anchor
                  ? "Comment on this area"
                  : "Your comment"
          }
          placeholder={
            parentId ? "Continue the discussion…" : "What needs attention?"
          }
          disabled={busy}
          suggestions={!parentId && !edgeId}
          onSubmitShortcut={() => void submit()}
          helperText={
            stepId && !anchor && !parentId
              ? "For a precise location, click an area of the captured screen."
              : undefined
          }
        />
        <Button
          type="submit"
          maxW="full"
          minH="11"
          h="auto"
          py="2"
          whiteSpace="normal"
          size="sm"
          colorPalette="blue"
          mt="3"
          loading={busy}
          disabled={
            (!body.trim() && !draft.files.length) || draft.preparing || busy
          }
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
        <Text role="alert" color="red.fg">
          {error}
        </Text>
      )}
      {notice && (
        <Text role="status" fontSize="xs" color="green.fg">
          {notice}
        </Text>
      )}
    </Stack>
  );
}
