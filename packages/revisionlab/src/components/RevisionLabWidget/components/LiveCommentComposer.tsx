import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Field,
  Flex,
  Popover,
  Portal,
  Stack,
  Text,
  Textarea,
  VisuallyHidden,
} from "@chakra-ui/react";
import { apiRequest } from "../../../client/api.js";
import { resolveElementAnchor } from "../../../client/element-anchor.js";
import type { RevisionLabElementAnchor } from "../../../server/types.js";
import { useElementBounds } from "../hooks/useElementBounds.js";

export function LiveCommentComposer({
  anchor,
  route,
  apiPath,
  onCancel,
  onEscape,
  onSaved,
}: {
  anchor: RevisionLabElementAnchor;
  route: string;
  apiPath: string;
  onCancel: () => void;
  onEscape: () => void;
  onSaved: () => void;
}) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const input = useRef<HTMLTextAreaElement>(null);
  const pending = useRef(false);
  const bounds = useElementBounds(resolveElementAnchor(anchor));
  useEffect(() => {
    // The always-open popover's portal mounts after the initial focus request.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() =>
        input.current?.focus({ preventScroll: true }),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  async function post() {
    if (pending.current || !body.trim()) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await apiRequest(apiPath, "comments", {
        method: "POST",
        body: JSON.stringify({
          route,
          body: body.trim(),
          elementAnchor: anchor,
        }),
      });
      onSaved();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not post your comment. Try again.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <Popover.Root
      open
      initialFocusEl={() => input.current}
      restoreFocus={false}
      closeOnInteractOutside={false}
      closeOnEscape={!busy}
      onOpenChange={(event) => {
        if (!event.open && !busy) onEscape();
      }}
      positioning={{ placement: "bottom-start", strategy: "fixed", gutter: 12 }}
    >
      <Portal>
        <Box
          data-revisionlab-ui
          aria-hidden
          position="fixed"
          inset="0"
          zIndex="overlay"
        />
        <Popover.Anchor asChild>
          <Box
            data-revisionlab-ui
            aria-hidden
            position="fixed"
            pointerEvents="none"
            zIndex="overlay"
            left={bounds ? `${bounds.x}px` : "50%"}
            top={bounds ? `${bounds.y}px` : "20%"}
            w={bounds ? `${bounds.width}px` : "1px"}
            h={bounds ? `${bounds.height}px` : "1px"}
            borderWidth={bounds ? "2px" : "0"}
            borderColor="blue.600"
            borderRadius="sm"
          />
        </Popover.Anchor>
        <Popover.Positioner data-revisionlab-ui>
          <Popover.Content
            aria-label="Add comment"
            w="sm"
            maxW="calc(100vw - 2rem)"
            bg="white"
            color="gray.900"
            borderRadius="lg"
            shadow="lg"
          >
            <Popover.Arrow />
            <Popover.Body p="4" maxH="calc(100dvh - 7rem)" overflowY="auto">
              <Stack gap="3">
                <Field.Root required invalid={Boolean(error)}>
                  <VisuallyHidden asChild>
                    <Field.Label>Comment</Field.Label>
                  </VisuallyHidden>
                  <Textarea
                    ref={input}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Write a comment..."
                    rows={4}
                    maxLength={4000}
                    resize="vertical"
                    disabled={busy}
                  />
                </Field.Root>
                {!bounds && (
                  <Text role="status" fontSize="xs" color="orange.800">
                    The selected element is no longer visible.
                  </Text>
                )}
                {error && (
                  <Text role="alert" fontSize="sm" color="red.700">
                    {error}
                  </Text>
                )}
                <Flex justify="end" gap="2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={busy}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    colorPalette="blue"
                    onClick={() => void post()}
                    loading={busy}
                    disabled={!body.trim()}
                  >
                    Post
                  </Button>
                </Flex>
              </Stack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
