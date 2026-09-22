import { Button, Flex, Icon, IconButton, Text } from "@chakra-ui/react";
import { MessageSquarePlus, Minus, Plus } from "lucide-react";

interface ScreenCommentToolbarProps {
  instructionsId: string;
  commentMode: boolean;
  showBubbles: boolean;
  showResolved: boolean;
  zoom: number;
  onToggleCommentMode: () => void;
  onToggleBubbles: () => void;
  onToggleResolved: () => void;
  onZoomChange: (zoom: number) => void;
}

export function ScreenCommentToolbar({
  instructionsId,
  commentMode,
  showBubbles,
  showResolved,
  zoom,
  onToggleCommentMode,
  onToggleBubbles,
  onToggleResolved,
  onZoomChange,
}: ScreenCommentToolbarProps) {
  return (
    <Flex align="center" justify="space-between" gap="3" flexWrap="wrap">
      <Text id={instructionsId} color="gray.600" fontSize="xs">
        Comments stay beside their pins. Open a bubble to reply. To add a pin,
        click the image or focus it and press Enter.
      </Text>
      <Flex gap="2" align="center" flexWrap="wrap">
        <Button
          size="sm"
          variant={commentMode ? "solid" : "outline"}
          aria-pressed={commentMode}
          onClick={onToggleCommentMode}
        >
          <Icon>
            <MessageSquarePlus />
          </Icon>
          Add comment
        </Button>
        <Button
          size="sm"
          variant="ghost"
          aria-pressed={showBubbles}
          onClick={onToggleBubbles}
        >
          {showBubbles ? "Hide comment bubbles" : "Show comment bubbles"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleResolved}
          aria-pressed={showResolved}
        >
          {showResolved ? "Hide resolved pins" : "Show resolved pins"}
        </Button>
        <Flex gap="2" align="center" flexShrink="0" aria-label="Screen zoom">
          <IconButton
            size="sm"
            variant="outline"
            aria-label="Zoom out of screen"
            disabled={zoom <= 1}
            onClick={() => onZoomChange(Math.max(1, zoom - 0.25))}
          >
            <Icon>
              <Minus />
            </Icon>
          </IconButton>
          <Text fontSize="xs" minW="10" textAlign="center" aria-live="polite">
            {Math.round(zoom * 100)}%
          </Text>
          <IconButton
            size="sm"
            variant="outline"
            aria-label="Zoom into screen"
            disabled={zoom >= 2}
            onClick={() => onZoomChange(Math.min(2, zoom + 0.25))}
          >
            <Icon>
              <Plus />
            </Icon>
          </IconButton>
        </Flex>
      </Flex>
    </Flex>
  );
}
