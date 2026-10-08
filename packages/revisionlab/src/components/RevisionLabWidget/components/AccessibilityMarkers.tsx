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
          borderColor="red.border"
          bg="red.solid/10"
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
              left={`clamp(4px, ${bounds.x - 12}px, calc(100vw - 36px))`}
              top={`clamp(4px, ${bounds.y - 12}px, calc(100dvh - 36px))`}
              boxSize="8"
              minW="8"
              borderRadius="full"
              colorPalette="red"
              bg="red.solid"
              color="colorPalette.contrast"
              borderWidth="1px"
              borderColor="bg.panel"
              _hover={{ bg: "red.solid" }}
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
