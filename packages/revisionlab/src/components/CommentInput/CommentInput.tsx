"use client";

import { useId, useState, type RefObject } from "react";
import {
  Combobox,
  createListCollection,
  Field,
  Stack,
} from "@chakra-ui/react";
import { ControlledCommentTextarea } from "./components/ControlledCommentTextarea.js";
import { CommentSuggestions } from "./components/CommentSuggestions.js";
import { commentChoices } from "./choices.js";
import { CommentComposerTools } from "./components/CommentComposerTools.js";
import type { CommentDraft } from "./hooks/useCommentDraft.js";
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
  draft,
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
  draft?: CommentDraft;
}) {
  const id = useId();
  const [caret, setCaret] = useState(value.length);
  const beforeCaret = value.slice(0, caret);
  const query = /(?:^|\s)@([^\s]*)$/.exec(beforeCaret);
  const mentionStart = query ? beforeCaret.lastIndexOf("@") : null;
  const similar = useCommentSuggestions(
    apiPath,
    route,
    value,
    suggestions && !disabled,
  );
  const mentioning = Boolean(query && draft?.options);
  const items = commentChoices(query?.[1], draft?.options ?? null, similar);
  const enhanced = suggestions || Boolean(draft?.supported);
  const collection = createListCollection({
    items,
    itemToString: (item) => item.body,
    itemToValue: (item) => item.id,
  });
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState<string | null>(null);
  const open = focused && items.length > 0 && dismissed !== value;
  const textarea = (
    <ControlledCommentTextarea
      ref={inputRef}
      id={id}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
        setCaret(event.target.selectionStart);
        setDismissed(null);
      }}
      placeholder={placeholder}
      rows={4}
      maxLength={4000}
      minH="24"
      bg="bg.panel"
      borderColor="border.emphasized"
      resize="vertical"
      onPaste={(event) => {
        const files = Array.from(event.clipboardData.files);
        if (!files.length || !draft) return;
        event.preventDefault();
        if (disabled || !draft.supported) {
          draft.setError(
            "Attachments are unavailable until workspace options load.",
          );
          return;
        }
        draft.setFiles([...draft.files.map((record) => record.file), ...files]);
      }}
      onSelect={(event) => setCaret(event.currentTarget.selectionStart)}
      onFocus={() => {
        setFocused(true);
        setCaret(inputRef.current?.selectionStart ?? value.length);
      }}
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
    <Stack gap="2">
      <Field.Root disabled={disabled}>
        <Field.Label htmlFor={id}>{label}</Field.Label>
        {enhanced ? (
          <Combobox.Root
            collection={collection}
            ids={{ input: id }}
            inputValue={value}
            value={[]}
            allowCustomValue
            selectionBehavior="preserve"
            open={open}
            openOnKeyPress={false}
            onOpenChange={(event) => {
              if (!event.open) setDismissed(value);
            }}
            onValueChange={(event) => {
              const selected = event.items[0];
              if (selected) {
                if (selected.identity && draft && mentionStart !== null) {
                  const position = draft.addMention(
                    selected.identity,
                    selected.identity.kind,
                    mentionStart,
                    caret,
                  );
                  if (position !== null)
                    requestAnimationFrame(() => {
                      inputRef.current?.focus();
                      inputRef.current?.setSelectionRange(position, position);
                      setCaret(position);
                    });
                  setDismissed(value);
                } else {
                  onChange(selected.body);
                  setDismissed(selected.body);
                }
              }
            }}
            disabled={disabled}
            positioning={{ placement: "bottom-start", sameWidth: true }}
          >
            <Combobox.Control>
              <Combobox.Input asChild>{textarea}</Combobox.Input>
            </Combobox.Control>
            <CommentSuggestions items={items} mentioning={mentioning} />
          </Combobox.Root>
        ) : (
          textarea
        )}
        {helperText && <Field.HelperText>{helperText}</Field.HelperText>}
      </Field.Root>
      {draft && (
        <CommentComposerTools
          draft={draft}
          disabled={disabled}
          inputRef={inputRef}
          onMentionRequested={() => setDismissed(null)}
        />
      )}
    </Stack>
  );
}
