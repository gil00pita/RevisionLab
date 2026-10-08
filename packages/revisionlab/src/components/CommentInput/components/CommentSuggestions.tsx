import { Combobox, Portal, Stack, Text } from "@chakra-ui/react";
import type { CommentChoice } from "../choices.js";

export function CommentSuggestions({
  items,
  mentioning,
}: {
  items: CommentChoice[];
  mentioning: boolean;
}) {
  return (
    <Portal>
      <Combobox.Positioner
        data-revisionlab-ui
        color="fg"
        colorPalette="blue"
        zIndex="popover"
      >
        <Combobox.Content
          bg="bg.panel"
          color="fg"
          borderColor="border.emphasized"
          borderWidth="1px"
          maxH="64"
          overflowY="auto"
          shadow="lg"
        >
          <Combobox.ItemGroup>
            <Combobox.ItemGroupLabel>
              {mentioning
                ? "Mention a persona or user"
                : "Similar comments on this page"}
            </Combobox.ItemGroupLabel>
            {items.map((item) => (
              <Combobox.Item
                key={item.id}
                item={item}
                whiteSpace="normal"
                alignItems="start"
                _highlighted={{ bg: "blue.subtle" }}
              >
                <Stack gap="1" minW="0">
                  <Combobox.ItemText overflowWrap="anywhere">
                    {item.body}
                  </Combobox.ItemText>
                  <Text fontSize="xs" color="fg.muted">
                    {item.detail}
                  </Text>
                </Stack>
              </Combobox.Item>
            ))}
          </Combobox.ItemGroup>
        </Combobox.Content>
      </Combobox.Positioner>
    </Portal>
  );
}
