import { Button, Flex, Icon, IconButton, Separator, VisuallyHidden } from "@chakra-ui/react";
import { MessageSquarePlus, Minus, Plus } from "lucide-react";

interface ScreenCommentToolbarProps {
  instructionsId: string;
  commentMode: boolean;
  zoom: number;
  onToggleCommentMode: () => void;
  onZoomChange: (zoom: number) => void;
}

export function ScreenCommentToolbar({
  instructionsId,
  commentMode,
  zoom,
  onToggleCommentMode,
  onZoomChange,
}: ScreenCommentToolbarProps) {
  return (
    <Flex
      role="group"
      aria-label="Screen view controls"
      position="absolute"
      bottom={{ base: "3", md: "4" }}
      right={{ base: "2", md: "4" }}
      w="52"
      maxW="calc(100% - 1rem)"
      zIndex="3"
      align="center"
      gap="0"
      p="1"
      bg="bg.panel"
      borderWidth="1px"
      borderColor="border"
      borderRadius="md"
      boxShadow="md"
    >
      <VisuallyHidden id={instructionsId}>
        To add a pin, enable Add comment, then click the image or focus it and
        press Enter. Open a saved pin to read and reply beside its location.
      </VisuallyHidden>
      <IconButton
        size="sm"
        variant="ghost"
        flex="1"
        minW="0"
        p="0"
        aria-label="Zoom out of screen"
        title="Zoom out of screen"
        disabled={zoom <= 1}
        onClick={() => onZoomChange(Math.max(1, zoom - 0.25))}
      >
        <Icon><Minus /></Icon>
      </IconButton>
      <Button
        size="sm"
        variant="ghost"
        aria-label="Reset screen zoom to 100 percent"
        title="Reset screen zoom to 100 percent"
        flex="1.4"
        minW="0"
        px="0"
        fontSize="xs"
        fontVariantNumeric="tabular-nums"
        onClick={() => onZoomChange(1)}
      >
        {Math.round(zoom * 100)}%
      </Button>
      <IconButton
        size="sm"
        variant="ghost"
        flex="1"
        minW="0"
        p="0"
        aria-label="Zoom into screen"
        title="Zoom into screen"
        disabled={zoom >= 2}
        onClick={() => onZoomChange(Math.min(2, zoom + 0.25))}
      >
        <Icon><Plus /></Icon>
      </IconButton>
      <Separator orientation="vertical" h="5" mx="1" flexShrink="0" />
      <IconButton
        size="sm"
        variant={commentMode ? "solid" : "ghost"}
        flex="1"
        minW="0"
        p="0"
        colorPalette="blue"
        aria-label="Add comment on capture"
        title={commentMode ? "Stop placing comment pins" : "Add comment on capture"}
        aria-pressed={commentMode}
        aria-describedby={instructionsId}
        onClick={onToggleCommentMode}
      >
        <Icon><MessageSquarePlus /></Icon>
      </IconButton>
    </Flex>
  );
}
