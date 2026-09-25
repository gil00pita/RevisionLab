import { Field, Grid, Icon, RadioGroup } from "@chakra-ui/react";
import { Check } from "lucide-react";
import {
  commentBubbleColors,
  commentBubbleTokens,
  type CommentBubbleColor,
} from "../../../comment-settings.js";

export function BubbleColorPicker({
  value,
  disabled,
  readOnly,
  onChange,
}: {
  value: CommentBubbleColor;
  disabled: boolean;
  readOnly: boolean;
  onChange: (color: CommentBubbleColor) => void;
}) {
  return (
    <Field.Root disabled={disabled}>
      <Field.Label>Bubble color</Field.Label>
      <RadioGroup.Root
        aria-label="Bubble color"
        value={value}
        disabled={disabled}
        readOnly={readOnly}
        onValueChange={(event) => {
          const color = commentBubbleColors.find(
            (item) => item === event.value,
          );
          if (color) onChange(color);
        }}
        w="full"
      >
        <Grid templateColumns="repeat(5, minmax(0, 1fr))" gap="4" maxW="sm">
          {commentBubbleColors.map((color) => (
            <RadioGroup.Item
              key={color}
              value={color}
              flexDirection="column"
              gap="2"
              cursor="pointer"
              _disabled={{ cursor: "not-allowed" }}
            >
              <RadioGroup.ItemHiddenInput />
              <RadioGroup.ItemControl
                w="10"
                h="10"
                flexShrink="0"
                borderRadius="full"
                bg={commentBubbleTokens(color).solid}
                color={commentBubbleTokens(color).contrast}
                borderWidth="2px"
                borderColor={commentBubbleTokens(color).outline}
                _checked={{
                  outlineWidth: "2px",
                  outlineStyle: "solid",
                  outlineColor: "gray.900",
                  outlineOffset: "3px",
                }}
                _focusVisible={{
                  outlineWidth: "3px",
                  outlineStyle: "solid",
                  outlineColor: "blue.700",
                  outlineOffset: "3px",
                }}
              >
                {value === color && (
                  <Icon boxSize="5">
                    <Check />
                  </Icon>
                )}
              </RadioGroup.ItemControl>
              <RadioGroup.ItemText fontSize="xs" textTransform="capitalize">
                {color}
              </RadioGroup.ItemText>
            </RadioGroup.Item>
          ))}
        </Grid>
      </RadioGroup.Root>
    </Field.Root>
  );
}
