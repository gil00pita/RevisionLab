import {
  widgetPlacement,
  type WidgetSettings,
} from "../../../widget-settings.js";
import { Box, Link, Portal, Stack, Switch, Text } from "@chakra-ui/react";
import { useEffect, useRef } from "react";
import type { RevisionLabElementAnchor } from "../../../server/types.js";
import { useElementPicker } from "../hooks/useElementPicker.js";
import { useElementBounds } from "../hooks/useElementBounds.js";

export function ElementPicker({
  settings,
  showControls,
  onSelect,
  onCancel,
  commentsHref,
  showBalloons,
  onShowBalloonsChange,
}: {
  settings: WidgetSettings;
  showControls: boolean;
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
          borderColor="blue.border"
          bg="blue.solid/10"
        />
      )}
      {showControls && (
        <Stack
          data-revisionlab-ui
          position="fixed"
          {...widgetPlacement(settings, true)}
          zIndex="popover"
          maxW="calc(100vw - 1.5rem)"
          px="4"
          py="3"
          gap="1"
          bg="bg.panel"
          color="fg"
          borderWidth="1px"
          borderColor="border"
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
          <Link href={commentsHref} color="blue.fg" fontSize="sm">
            Show all comments from this page
          </Link>
          <Text fontSize="xs" color="fg.muted">
            Press Esc to close the comments.
          </Text>
        </Stack>
      )}
    </Portal>
  );
}
