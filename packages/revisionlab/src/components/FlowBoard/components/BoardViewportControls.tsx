import { Button, Flex, Icon, IconButton, Separator } from "@chakra-ui/react";
import { Maximize, Minus, Plus } from "lucide-react";
import { MAX_BOARD_ZOOM } from "../viewport.js";

export function BoardViewportControls({
  zoom,
  minZoom,
  onZoom,
  onFit,
}: {
  zoom: number;
  minZoom: number;
  onZoom: (zoom: number) => void;
  onFit: () => void;
}) {
  return (
    <Flex
      role="group"
      aria-label="Board view controls"
      position="absolute"
      bottom={{ base: "3", md: "4" }}
      right={{ base: "3", md: "4" }}
      zIndex="1"
      align="center"
      gap="1"
      p="1"
      bg="white"
      borderWidth="1px"
      borderColor="gray.200"
      borderRadius="md"
      boxShadow="md"
    >
      <IconButton
        aria-label="Zoom out"
        title="Zoom out"
        size="sm"
        variant="ghost"
        onClick={() => onZoom(zoom - 0.1)}
        disabled={zoom <= minZoom}
      >
        <Icon>
          <Minus />
        </Icon>
      </IconButton>
      <Button
        aria-label="Reset zoom to 100 percent"
        title="Reset zoom to 100 percent"
        size="sm"
        variant="ghost"
        onClick={() => onZoom(1)}
        w="16"
        flexShrink="0"
        fontVariantNumeric="tabular-nums"
      >
        {Math.round(zoom * 100)}%
      </Button>
      <IconButton
        aria-label="Zoom in"
        title="Zoom in"
        size="sm"
        variant="ghost"
        onClick={() => onZoom(zoom + 0.1)}
        disabled={zoom >= MAX_BOARD_ZOOM}
      >
        <Icon>
          <Plus />
        </Icon>
      </IconButton>
      <Separator orientation="vertical" h="5" mx="1" />
      <IconButton
        aria-label="Fit"
        title="Fit board to view"
        size="sm"
        variant="ghost"
        onClick={onFit}
      >
        <Icon>
          <Maximize />
        </Icon>
      </IconButton>
    </Flex>
  );
}
