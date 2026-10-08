import type { ReactNode } from "react";
import { Badge, Box, Icon, IconButton, Spinner } from "@chakra-ui/react";
import { Square } from "lucide-react";
import { ToolHint } from "./ToolHint.js";

export function WidgetTool({
  label,
  variant = "default",
  disabled = false,
  onClick,
  count = 0,
  children,
}: {
  label: string;
  variant?: "default" | "stop" | "scanning";
  disabled?: boolean;
  onClick: () => void;
  count?: number;
  children?: ReactNode;
}) {
  const active = variant !== "default";
  const background = variant === "scanning" ? "blue.solid" : "red.solid";
  const hoverBackground = variant === "scanning" ? "blue.solid/90" : "red.solid/90";
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
          color="colorPalette.contrast"
          bg={active ? background : "transparent"}
          size="sm"
          boxSize="9"
          minW="9"
          borderRadius="full"
          mx="1"
          _hover={{ bg: active ? hoverBackground : "fg/12" }}
          focusRing="inset"
        >
          {variant === "scanning" ? (
            <Spinner
              aria-hidden
              size="sm"
              _motionReduce={{ animation: "none" }}
            />
          ) : (
            children ?? (
              <Icon boxSize="5">
                <Square />
              </Icon>
            )
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
          bg="bg.panel"
          color="blue.fg"
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
