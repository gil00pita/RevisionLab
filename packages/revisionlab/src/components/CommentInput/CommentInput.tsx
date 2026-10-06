"use client";

import { useId, useState, type RefObject } from "react";
import {
  Combobox,
  createListCollection,
  Field,
  Portal,
  Stack,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useCommentSuggestions } from "./hooks/useCommentSuggestions.js";

export function CommentInput({
  apiPath,
  route,
  value,
  onChange,
  label,
  placeholder,
  disabled,
  inputRef,
  suggestions = true,
  onSubmitShortcut,
  helperText,
}: {
  apiPath: string;
  route: string;
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder: string;
  disabled: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  suggestions?: boolean;
  onSubmitShortcut?: () => void;
  helperText?: string;
}) {
  const id = useId();
  const items = useCommentSuggestions(
    apiPath,
    route,
    value,
    suggestions && !disabled,
  );
  const collection = createListCollection({
    items,
    itemToString: (item) => item.body,
    itemToValue: (item) => item.id,
  });
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const open = focused && items.length > 0 && dismissed !== value;
  const textarea = (
    <Textarea
      ref={inputRef}
      id={id}
      value={suggestions ? undefined : value}
      onChange={suggestions ? undefined : (event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={4}
      maxLength={4000}
      minH="24"
      bg="white"
      borderColor="gray.300"
      resize="vertical"
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onKeyDown={(event) => {
        if (
          (event.metaKey || event.ctrlKey) &&
          event.key === "Enter" &&
          onSubmitShortcut
        ) {
          event.preventDefault();
          onSubmitShortcut();
        }
      }}
    />
  );
  return (
    <Field.Root disabled={disabled}>
      <Field.Label htmlFor={id}>{label}</Field.Label>
      {suggestions ? (
        <Combobox.Root
          collection={collection}
          ids={{ input: id }}
          inputValue={value}
          value={[]}
          allowCustomValue
          open={open}
          openOnKeyPress={false}
          onOpenChange={(event) => {
            if (!event.open) setDismissed(value);
          }}
          onInputValueChange={(event) => onChange(event.inputValue)}
          onValueChange={(event) => {
            const selected = event.items[0];
            if (selected) {
              onChange(selected.body);
              setDismissed(selected.body);
            }
          }}
          disabled={disabled}
          positioning={{ placement: "bottom-start", sameWidth: true }}
        >
          <Combobox.Control>
            <Combobox.Input asChild>{textarea}</Combobox.Input>
          </Combobox.Control>
          <Portal>
            <Combobox.Positioner data-revisionlab-ui zIndex="popover">
              <Combobox.Content
                bg="white"
                color="gray.900"
                borderColor="gray.300"
                borderWidth="1px"
                maxH="64"
                overflowY="auto"
                shadow="lg"
              >
                <Combobox.ItemGroup>
                  <Combobox.ItemGroupLabel>
                    Similar comments on this page
                  </Combobox.ItemGroupLabel>
                  {items.map((item) => (
                    <Combobox.Item
                      key={item.id}
                      item={item}
                      whiteSpace="normal"
                      alignItems="start"
                      _highlighted={{ bg: "blue.50" }}
                    >
                      <Stack gap="1" minW="0">
                        <Combobox.ItemText overflowWrap="anywhere">
                          {item.body}
                        </Combobox.ItemText>
                        <Text fontSize="xs" color="gray.600">
                          {item.occurrences} existing occurrence
                          {item.occurrences === 1 ? "" : "s"} · use this wording
                        </Text>
                      </Stack>
                    </Combobox.Item>
                  ))}
                </Combobox.ItemGroup>
              </Combobox.Content>
            </Combobox.Positioner>
          </Portal>
        </Combobox.Root>
      ) : (
        textarea
      )}
      {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
    </Field.Root>
  );
}
