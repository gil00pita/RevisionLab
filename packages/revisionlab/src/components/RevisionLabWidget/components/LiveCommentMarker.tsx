import { forwardRef } from "react";
import { Button, Icon, type ButtonProps } from "@chakra-ui/react";
import { MessageSquare } from "lucide-react";
import {
  commentBubbleTokens,
  type CommentBubbleColor,
} from "../../../comment-settings.js";

export const LiveCommentMarker = forwardRef<
  HTMLButtonElement,
  ButtonProps & {
    bubbleColor: CommentBubbleColor;
    count: number;
  }
>(function LiveCommentMarker({ bubbleColor, count, ...props }, ref) {
  const colors = commentBubbleTokens(bubbleColor);
  return (
    <Button
      ref={ref}
      data-revisionlab-ui
      h="8"
      minW="8"
      size="xs"
      borderRadius="full"
      colorPalette={bubbleColor}
      bg={colors.solid}
      color={colors.contrast}
      borderWidth="1px"
      borderColor={colors.outline}
      _hover={{ bg: colors.hover }}
      focusRingColor={colors.outline}
      {...props}
    >
      <Icon>
        <MessageSquare />
      </Icon>
      {count}
    </Button>
  );
});
