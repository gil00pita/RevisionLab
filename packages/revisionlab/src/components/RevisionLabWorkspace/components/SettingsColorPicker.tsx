import { Field, Grid, Icon, RadioGroup } from "@chakra-ui/react";
import { Check } from "lucide-react";
import {
  commentBubbleColors,
  commentBubbleTokens,
  type CommentBubbleColor,
} from "../../../comment-settings.js";

export function SettingsColorPicker({
  value,
  label = "Bubble color",
  tokens = commentBubbleTokens,
  disabled,
  readOnly,
  onChange,
}: {
  value: CommentBubbleColor;
  label?: string;
  tokens?: (color: CommentBubbleColor) => {
    solid: string;
    contrast: string;
    outline: string;
  };
  disabled: boolean;
  readOnly: boolean;
  onChange: (color: CommentBubbleColor) => void;
}) {
  return (
    <Field.Root disabled={disabled}>
      <Field.Label>{label}</Field.Label>
      <RadioGroup.Root
        aria-label={label}
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
                bg={tokens(color).solid}
                color={tokens(color).contrast}
                borderWidth="2px"
                borderColor={tokens(color).outline}
                _checked={{
                  outlineWidth: "2px",
                  outlineStyle: "solid",
                  outlineColor: "fg.muted",
                  outlineOffset: "3px",
                }}
                _focusVisible={{
                  outlineWidth: "3px",
                  outlineStyle: "solid",
                  outlineColor: "blue.border",
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
