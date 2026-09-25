import { Box, Link, Portal, Stack, Switch, Text } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import type { RevisionLabElementAnchor } from "../../../server/types.js";
import { useElementPicker } from "../hooks/useElementPicker.js";
import { useElementBounds } from "../hooks/useElementBounds.js";

export function ElementPicker({
  onSelect,
  onCancel,
  commentsHref,
  showBalloons,
  onShowBalloonsChange,
}: {
  onSelect: (anchor: RevisionLabElementAnchor) => void;
  onCancel: () => void;
  commentsHref: string;
  showBalloons: boolean;
  onShowBalloonsChange: (show: boolean) => void;
}) {
  const picker = useElementPicker(onSelect, onCancel);
  const bounds = useElementBounds(picker.target);
  const surface = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      surface.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <Portal>
      <Box
        ref={surface}
        tabIndex={-1}
        aria-label="Select an element to comment"
        data-revisionlab-ui
        data-revisionlab-picker-surface
        position="fixed"
        inset="0"
        zIndex="overlay"
        cursor="crosshair"
      />
      {bounds && (
        <Box
          data-revisionlab-ui
          aria-hidden
          position="fixed"
          pointerEvents="none"
          zIndex="overlay"
          left={`${bounds.x}px`}
          top={`${bounds.y}px`}
          width={`${bounds.width}px`}
          height={`${bounds.height}px`}
          borderWidth="2px"
          borderStyle="solid"
          borderColor="blue.600"
          bg="blue.500/10"
        />
      )}
      <Stack
        data-revisionlab-ui
        position="fixed"
        bottom="24"
        right={{ base: "3", md: "6" }}
        zIndex="popover"
        maxW="calc(100vw - 1.5rem)"
        px="4"
        py="3"
        gap="1"
        bg="white"
        color="gray.900"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="lg"
        shadow="sm"
      >
        <Switch.Root
          size="sm"
          colorPalette="blue"
          checked={showBalloons}
          onCheckedChange={(event) => onShowBalloonsChange(event.checked)}
          mb="2"
        >
          <Switch.HiddenInput />
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Switch.Label>Show comments notes</Switch.Label>
        </Switch.Root>
        <Link href={commentsHref} color="blue.700" fontSize="sm">
          Show all comments from this page
        </Link>
        <Text fontSize="xs" color="gray.600">
          Press Esc to close the comments.
        </Text>
      </Stack>
    </Portal>
  );
}
