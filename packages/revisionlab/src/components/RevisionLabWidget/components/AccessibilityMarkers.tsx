import { Box, Icon, IconButton, Portal } from "@chakra-ui/react";
import { CircleAlert } from "lucide-react";
import type { useAccessibilityInspection } from "../hooks/useAccessibilityInspection.js";
import { ToolHint } from "./ToolHint.js";

export function AccessibilityMarkers({
  inspection,
}: {
  inspection: ReturnType<typeof useAccessibilityInspection>;
}) {
  return (
    <Portal>
      {inspection.highlight && (
        <Box
          data-revisionlab-ui
          data-revisionlab-accessibility-highlight
          aria-hidden="true"
          position="fixed"
          pointerEvents="none"
          zIndex="overlay"
          left={`${inspection.highlight.x}px`}
          top={`${inspection.highlight.y}px`}
          w={`${inspection.highlight.width}px`}
          h={`${inspection.highlight.height}px`}
          borderWidth="2px"
          borderColor="red.700"
          bg="red.500/10"
        />
      )}
      {inspection.markers.map(({ targets, bounds }) => {
        const target = targets[0];
        const label = `Accessibility issue: ${target.issue.help} (${target.issue.targets[target.index].label})`;
        return (
          <ToolHint key={`${target.issue.id}:${target.index}`} label={label}>
            <IconButton
              data-revisionlab-ui
              data-revisionlab-accessibility-marker
              aria-label={label}
              aria-pressed={targets.some(
                (item) =>
                  item.issue === inspection.active?.issue &&
                  item.index === inspection.active.index,
              )}
              position="fixed"
              zIndex="modal"
              left={`${Math.max(4, Math.min(bounds.x - 12, window.innerWidth - 36))}px`}
              top={`${Math.max(4, Math.min(bounds.y - 12, window.innerHeight - 36))}px`}
              boxSize="8"
              minW="8"
              borderRadius="full"
              colorPalette="red"
              bg="red.700"
              color="white"
              borderWidth="1px"
              borderColor="white"
              _hover={{ bg: "red.800" }}
              onClick={() => inspection.select(target)}
            >
              <Icon boxSize="5">
                <CircleAlert />
              </Icon>
            </IconButton>
          </ToolHint>
        );
      })}
    </Portal>
  );
}
