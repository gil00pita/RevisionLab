import { CommentInput, useCommentDraft } from "../../CommentInput/index.js";
import { captureDimensions, captureScreen } from "../../../client/recording.js";
import { useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Popover,
  Portal,
  Stack,
  Text,
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
  const draft = useCommentDraft(apiPath);
  const { body, setBody } = draft;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [captureWarning, setCaptureWarning] = useState("");
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
    if (
      pending.current ||
      (!body.trim() && !draft.files.length) ||
      draft.preparing
    )
      return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      let screenshot: string | undefined;
      let screenshotAnchor: { x: number; y: number } | undefined;
      const target = resolveElementAnchor(anchor)?.getBoundingClientRect();
      const dimensions = captureDimensions();
      try {
        if (!captureWarning) screenshot = await captureScreen(true);
        if (target && screenshot)
          screenshotAnchor = {
            x: Math.max(
              0,
              Math.min(
                1,
                (target.x + target.width / 2 + window.scrollX) /
                  dimensions.width,
              ),
            ),
            y: Math.max(
              0,
              Math.min(
                1,
                (target.y + target.height / 2 + window.scrollY) /
                  dimensions.height,
              ),
            ),
          };
      } catch {
        setCaptureWarning(
          "The screenshot could not be captured. Post without a screenshot to save the comment with its element location.",
        );
        return;
      }
      await apiRequest(apiPath, "comments", {
        method: "POST",
        body: JSON.stringify({
          route,
          body: body.trim(),
          ...draft.payload(),
          elementAnchor: anchor,
          screenshot,
          screenshotAnchor,
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
            borderColor="blue.border"
            borderRadius="sm"
          />
        </Popover.Anchor>
        <Popover.Positioner data-revisionlab-ui color="fg" colorPalette="blue">
          <Popover.Content
            aria-label="Add comment"
            w="sm"
            maxW="calc(100vw - 2rem)"
            bg="bg.panel"
            color="fg"
            borderRadius="lg"
            shadow="lg"
          >
            <Popover.Arrow />
            <Popover.Body p="4" maxH="calc(100dvh - 7rem)" overflowY="auto">
              <Stack gap="3">
                <CommentInput
                  draft={draft}
                  apiPath={apiPath}
                  route={route}
                  inputRef={input}
                  value={body}
                  onChange={setBody}
                  label="Comment"
                  placeholder="Write a comment..."
                  disabled={busy}
                  onSubmitShortcut={() => void post()}
                />
                {captureWarning && (
                  <Text role="status" fontSize="xs" color="orange.fg">
                    {captureWarning}
                  </Text>
                )}
                {!bounds && (
                  <Text role="status" fontSize="xs" color="orange.fg">
                    The selected element is no longer visible.
                  </Text>
                )}
                {error && (
                  <Text role="alert" fontSize="sm" color="red.fg">
                    {error}
                  </Text>
                )}
                <Flex justify="end" gap="2" wrap="wrap">
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
                    disabled={
                      (!body.trim() && !draft.files.length) ||
                      draft.preparing ||
                      busy
                    }
                  >
                    {captureWarning ? "Post without screenshot" : "Post"}
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
