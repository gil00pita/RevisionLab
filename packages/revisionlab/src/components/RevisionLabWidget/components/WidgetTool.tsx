import type { ReactNode } from "react";
import { Badge, Box, Icon, IconButton } from "@chakra-ui/react";
import { Square } from "lucide-react";
import { ToolHint } from "./ToolHint.js";

export function WidgetTool({
  label,
  active = false,
  disabled = false,
  onClick,
  count = 0,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  count?: number;
  children?: ReactNode;
}) {
  return (
    <Box position="relative" flexShrink="0">
      <ToolHint label={label}>
        <IconButton
          aria-label={label}
          onClick={(event) => {
            // A stopped mode removes this button; keep keyboard focus on the widget.
            if (active)
              event.currentTarget
                .closest("[data-revisionlab-ui]")
                ?.querySelector<HTMLButtonElement>("[data-widget-toggle]")
                ?.focus({ preventScroll: true });
            onClick();
          }}
          disabled={disabled}
          variant="plain"
          color="white"
          bg={active ? "red.700" : "transparent"}
          size="sm"
          boxSize="9"
          minW="9"
          borderRadius="full"
          mx="1"
          _hover={{ bg: active ? "red.800" : "blackAlpha.200" }}
          focusRing="inset"
        >
          {children ?? (
            <Icon boxSize="5">
              <Square />
            </Icon>
          )}
        </IconButton>
      </ToolHint>
      {count > 0 && (
        <Badge
          position="absolute"
          top="1"
          right="1"
          pointerEvents="none"
          borderRadius="full"
          bg="white"
          color="blue.800"
          minW="4"
          justifyContent="center"
          fontSize="10px"
          aria-label={`${count} open page comments`}
        >
          {count > 99 ? "99+" : count}
        </Badge>
      )}
    </Box>
  );
}
