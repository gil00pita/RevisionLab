import {
  Box,
  Button,
  Flex,
  Icon,
  IconButton,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { ArrowLeft, ArrowRight, MessageSquare, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { createElementAnchor } from "../../../client/element-anchor.js";
import type { RevisionLabElementAnchor } from "../../../server/types.js";
import { useElementPicker } from "../hooks/useElementPicker.js";
import { useElementBounds } from "../hooks/useElementBounds.js";

export function ElementPicker({
  onSelect,
  onCancel,
  children,
}: {
  onSelect: (anchor: RevisionLabElementAnchor) => void;
  onCancel: () => void;
  children?: ReactNode;
}) {
  const picker = useElementPicker(onSelect, onCancel);
  const bounds = useElementBounds(picker.target);
  const anchor = picker.target ? createElementAnchor(picker.target) : null;
  const initialFocusRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Focus after the closing dialog releases its focus trap and the portal mounts.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() =>
        initialFocusRef.current?.focus({ preventScroll: true }),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <Portal>
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
        right={{ base: "4", md: "6" }}
        zIndex="popover"
        width="sm"
        maxW="calc(100vw - 2rem)"
        p="4"
        gap="3"
        bg="white"
        color="gray.900"
        borderWidth="1px"
        borderColor="gray.300"
        borderRadius="lg"
        shadow="lg"
      >
        <Flex justify="space-between" align="center" gap="2">
          <Text fontWeight="semibold">Select an element</Text>
          <IconButton
            aria-label="Cancel element selection"
            title="Cancel element selection"
            variant="ghost"
            size="sm"
            onClick={onCancel}
          >
            <Icon>
              <X />
            </Icon>
          </IconButton>
        </Flex>
        <Text fontSize="sm" role="status" overflowWrap="anywhere">
          {anchor ? `${anchor.tag}: ${anchor.label}` : "No element selected"}
        </Text>
        <Flex gap="2">
          <IconButton
            ref={initialFocusRef}
            aria-label="Previous element"
            title="Previous element"
            variant="outline"
            onClick={() => picker.move(-1)}
          >
            <Icon>
              <ArrowLeft />
            </Icon>
          </IconButton>
          <IconButton
            aria-label="Next element"
            title="Next element"
            variant="outline"
            onClick={() => picker.move(1)}
          >
            <Icon>
              <ArrowRight />
            </Icon>
          </IconButton>
          <Button
            flex="1"
            colorPalette="blue"
            disabled={!anchor}
            onClick={picker.confirm}
          >
            <Icon>
              <MessageSquare />
            </Icon>
            Comment here
          </Button>
        </Flex>
        {children}
      </Stack>
    </Portal>
  );
}
